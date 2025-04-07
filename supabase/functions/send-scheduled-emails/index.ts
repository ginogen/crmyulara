import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/googleapis@126';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req: Request) => {
  // Manejar solicitudes preflight OPTIONS inmediatamente
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener los correos programados que deben enviarse
    const now = new Date();
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('emails')
      .select(`
        *,
        gmail_credentials:gmail_credentials(*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now.toISOString());

    if (fetchError) {
      throw new Error('Error fetching scheduled emails');
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No scheduled emails to send' }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Procesar cada correo programado
    const results = await Promise.all(
      scheduledEmails.map(async (email: any) => {
        try {
          const oauth2Client = new google.auth.OAuth2(
            Deno.env.get('GOOGLE_CLIENT_ID'),
            Deno.env.get('GOOGLE_CLIENT_SECRET'),
            `${Deno.env.get('SUPABASE_URL')}/auth/v1/callback`
          );

          oauth2Client.setCredentials({
            access_token: email.gmail_credentials.access_token,
            refresh_token: email.gmail_credentials.refresh_token,
            expiry_date: new Date(email.gmail_credentials.expiry_date).getTime(),
          });

          const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

          // Crear el mensaje de correo electrónico
          const message = [
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `To: ${email.to_emails.join(', ')}`,
            `From: ${email.from_email}`,
            `Subject: ${email.subject}`,
            '',
            email.body,
          ].join('\n');

          const encodedMessage = btoa(message)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          // Enviar el correo electrónico
          const { data: sentMessage } = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
              raw: encodedMessage,
            },
          });

          // Actualizar el estado del correo en la base de datos
          await supabase
            .from('emails')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              message_id: sentMessage.id,
              thread_id: sentMessage.threadId,
            })
            .eq('id', email.id);

          return {
            id: email.id,
            status: 'success',
            messageId: sentMessage.id,
          };
        } catch (error: any) {
          console.error(`Error sending email ${email.id}:`, error);

          // Actualizar el estado del correo a error
          await supabase
            .from('emails')
            .update({
              status: 'error',
              error_message: error.message,
            })
            .eq('id', email.id);

          return {
            id: email.id,
            status: 'error',
            error: error.message,
          };
        }
      })
    );

    return new Response(
      JSON.stringify({
        message: 'Scheduled emails processed',
        results,
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    );
  }
}); 
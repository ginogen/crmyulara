import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://esm.sh/googleapis@126';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, body, scheduledFor } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Error getting user');
    }

    // Obtener las credenciales de Gmail del usuario
    const { data: gmailCredentials, error: credentialsError } = await supabase
      .from('gmail_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (credentialsError || !gmailCredentials) {
      throw new Error('Gmail credentials not found');
    }

    // Configurar el cliente de Gmail
    const oauth2Client = new google.auth.OAuth2(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      `${Deno.env.get('SUPABASE_URL')}/auth/v1/callback`
    );

    oauth2Client.setCredentials({
      access_token: gmailCredentials.access_token,
      refresh_token: gmailCredentials.refresh_token,
      expiry_date: new Date(gmailCredentials.expiry_date).getTime(),
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Crear el mensaje de correo electrónico
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to.join(', ')}`,
      `From: ${gmailCredentials.email}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedMessage = btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Si hay una fecha programada, guardar el correo para enviarlo más tarde
    if (scheduledFor) {
      const { error: saveError } = await supabase.from('emails').insert({
        user_id: user.id,
        to_emails: to,
        subject,
        body,
        from_email: gmailCredentials.email,
        scheduled_for: scheduledFor,
        status: 'scheduled',
      });

      if (saveError) {
        throw new Error('Error saving scheduled email');
      }

      return new Response(
        JSON.stringify({ message: 'Email scheduled successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Enviar el correo electrónico
    const { data: sentMessage } = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Guardar el correo enviado en la base de datos
    const { error: saveError } = await supabase.from('emails').insert({
      user_id: user.id,
      to_emails: to,
      subject,
      body,
      from_email: gmailCredentials.email,
      message_id: sentMessage.id,
      thread_id: sentMessage.threadId,
      sent_at: new Date().toISOString(),
      status: 'sent',
    });

    if (saveError) {
      throw new Error('Error saving sent email');
    }

    return new Response(
      JSON.stringify({ message: 'Email sent successfully', messageId: sentMessage.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 
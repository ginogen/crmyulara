import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { google } from 'googleapis';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
);

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Obtener las credenciales de Gmail del usuario
    const { data: credentials, error: credentialsError } = await supabase
      .from('gmail_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (credentialsError || !credentials) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
    }

    // Configurar el cliente de Gmail
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expiry_date: credentials.expiry_date,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Obtener los datos del correo electrónico
    const body = await request.json();
    const { subject, body: emailBody, to_emails, contact_ids, scheduled_for } = body;

    // Crear el mensaje en formato RFC 2822
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `From: ${credentials.email}`,
      `To: ${to_emails.join(', ')}`,
      `Subject: ${subject}`,
      '',
      emailBody
    ].join('\r\n');

    // Codificar el mensaje en base64
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    if (scheduled_for) {
      // Guardar el correo programado en la base de datos
      const { error: emailError } = await supabase
        .from('emails')
        .insert({
          user_id: user.id,
          contact_ids,
          subject,
          body: emailBody,
          to_emails,
          scheduled_for,
          status: 'scheduled',
          direction: 'outbound',
        });

      if (emailError) {
        return NextResponse.json({ error: 'Error scheduling email' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Email scheduled successfully' });
    } else {
      // Enviar el correo inmediatamente
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      // Guardar el correo enviado en la base de datos
      const { error: emailError } = await supabase
        .from('emails')
        .insert({
          user_id: user.id,
          contact_ids,
          subject,
          body: emailBody,
          to_emails,
          sent_at: new Date().toISOString(),
          status: 'sent',
          direction: 'outbound',
          message_id: response.data.id,
        });

      if (emailError) {
        return NextResponse.json({ error: 'Error saving sent email' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Email sent successfully', messageId: response.data.id });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
// Temporalmente comentado: Ruta de envío de Gmail
/*
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

    // Si hay una fecha programada, guardar para envío posterior
    if (scheduled_for) {
      const { error: scheduleError } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: user.id,
          to_emails,
          subject,
          body: emailBody,
          scheduled_for,
          contact_ids,
          raw_message: encodedMessage
        });

      if (scheduleError) {
        return NextResponse.json({ error: 'Error scheduling email' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Email scheduled successfully' });
    }

    // Enviar el correo inmediatamente
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    // Guardar el registro del correo enviado
    const { error: historyError } = await supabase
      .from('email_history')
      .insert({
        user_id: user.id,
        to_emails,
        subject,
        body: emailBody,
        contact_ids,
        status: 'sent'
      });

    if (historyError) {
      console.error('Error saving email history:', historyError);
    }

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
  }
}
*/

import { NextResponse } from 'next/server';

// Exportar una función mock para mantener la compatibilidad
export async function POST() {
  return NextResponse.json({ error: 'Gmail functionality is temporarily disabled' }, { status: 503 });
} 
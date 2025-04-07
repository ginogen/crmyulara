import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }

    // Obtener tokens de acceso y actualización
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obtener información del usuario de Gmail
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });

    const supabase = createClient();

    // Obtener el usuario actual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Guardar las credenciales en la base de datos
    const { error: dbError } = await supabase
      .from('gmail_credentials')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        email: profile.data.emailAddress,
      });

    if (dbError) {
      console.error('Error saving Gmail credentials:', dbError);
      return NextResponse.json({ error: 'Error saving credentials' }, { status: 500 });
    }

    // Redirigir al usuario de vuelta a la aplicación
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/contacts`);
  } catch (error) {
    console.error('Error in Gmail callback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
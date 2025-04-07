import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Crear cliente de Supabase para el servidor
  const supabase = createServerComponentClient({ cookies });

  if (error) {
    console.error('Error en la autenticación de Google:', error);
    return NextResponse.redirect(`${baseUrl}/contacts?error=google_auth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/contacts?error=no_code`);
  }

  try {
    // Obtener la sesión del usuario
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error al obtener usuario:', userError);
      return NextResponse.redirect(`${baseUrl}/contacts?error=auth_error`);
    }

    const userId = user.id;

    // Verificar que tenemos todas las variables de entorno necesarias
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Faltan variables de entorno necesarias');
      return NextResponse.redirect(`${baseUrl}/contacts?error=missing_env_vars`);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/google/callback`
    );

    try {
      const { tokens } = await oauth2Client.getToken(code);
      const { access_token, refresh_token, expiry_date } = tokens;

      if (!access_token || !refresh_token || !expiry_date) {
        console.error('Faltan tokens requeridos');
        return NextResponse.redirect(`${baseUrl}/contacts?error=missing_tokens`);
      }

      // Obtener información del usuario de Gmail
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const { data: profile } = await gmail.users.getProfile({ userId: 'me' });

      // Convertir el timestamp a formato ISO para PostgreSQL
      const expiryDateISO = new Date(expiry_date).toISOString();

      console.log('Guardando credenciales:', {
        userId,
        email: profile.emailAddress,
        expiryDate: expiryDateISO
      });

      // Guardar o actualizar las credenciales de Gmail
      const { error: upsertError } = await supabase
        .from('gmail_credentials')
        .upsert({
          user_id: userId,
          access_token,
          refresh_token,
          expiry_date: expiryDateISO,
          email: profile.emailAddress,
        });

      if (upsertError) {
        console.error('Error al guardar credenciales:', upsertError);
        return NextResponse.redirect(`${baseUrl}/contacts?error=db_error`);
      }

      return NextResponse.redirect(`${baseUrl}/contacts?success=gmail_connected`);
    } catch (tokenError) {
      console.error('Error al obtener tokens:', tokenError);
      return NextResponse.redirect(`${baseUrl}/contacts?error=token_error`);
    }
  } catch (error) {
    console.error('Error en el callback de Google:', error);
    return NextResponse.redirect(`${baseUrl}/contacts?error=callback_failed`);
  }
} 
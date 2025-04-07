// Temporalmente comentado: Ruta de envío directo de Gmail
/*
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { getServerSupabase } from '@/lib/supabase/config';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: Request) {
  try {
    // 1. Obtener el usuario autenticado
    const cookieStore = cookies();
    const supabase = getServerSupabase(cookieStore);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('DirectSend: Error de autenticación', authError);
      return NextResponse.json({ 
        error: 'Usuario no autenticado' 
      }, { status: 401 });
    }
    
    console.log('DirectSend: Usuario autenticado correctamente', {
      userId: user.id,
      email: user.email
    });
    
    // 2. Leer y validar los datos del correo
    let emailData;
    
    try {
      emailData = await request.json();
      console.log('DirectSend: Datos del correo leídos correctamente', {
        hasTo: Array.isArray(emailData.to),
        toLength: Array.isArray(emailData.to) ? emailData.to.length : 0,
        hasSubject: !!emailData.subject,
        hasBody: !!emailData.body
      });
    } catch (jsonError) {
      console.error('DirectSend: Error al leer el cuerpo de la solicitud', jsonError);
      return NextResponse.json({ 
        error: 'Error al leer el cuerpo de la solicitud' 
      }, { status: 400 });
    }
    
    const { to, subject, body } = emailData;
    
    if (!Array.isArray(to) || to.length === 0 || !subject || !body) {
      console.error('DirectSend: Datos del correo incompletos');
      return NextResponse.json({ 
        error: 'Datos del correo incompletos. Se requiere to (array), subject y body.' 
      }, { status: 400 });
    }
    
    // 3. Obtener las credenciales de Gmail del usuario
    console.log('DirectSend: Obteniendo credenciales de Gmail');
    const { data: credentials, error: credentialsError } = await supabase
      .from('gmail_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (credentialsError || !credentials) {
      console.error('DirectSend: Error al obtener credenciales de Gmail', credentialsError);
      return NextResponse.json({ 
        error: 'No se encontraron credenciales de Gmail para este usuario. Por favor, conecta tu cuenta de Gmail primero.' 
      }, { status: 400 });
    }
    
    console.log('DirectSend: Credenciales de Gmail obtenidas correctamente');
    
    // 4. Configurar cliente de Gmail
    console.log('DirectSend: Configurando cliente de Gmail');
    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gmail/callback`
    );
    
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expiry_date: credentials.expiry_date,
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // 5. Crear mensaje de correo
    console.log('DirectSend: Creando mensaje de correo');
    const message = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to.join(', ')}`,
      `From: ${credentials.email}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\r\n');
    
    // En Node.js usamos Buffer en lugar de btoa
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // 6. Enviar correo
    console.log('DirectSend: Enviando correo');
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log('DirectSend: Correo enviado correctamente', {
      messageId: response.data.id
    });
    
    // 7. Guardar registro del envío
    console.log('DirectSend: Guardando registro del envío');
    const { error: historyError } = await supabase
      .from('email_history')
      .insert({
        user_id: user.id,
        to_emails: to,
        subject,
        body,
        status: 'sent',
        message_id: response.data.id
      });
    
    if (historyError) {
      console.error('DirectSend: Error al guardar historial', historyError);
    } else {
      console.log('DirectSend: Historial guardado correctamente');
    }
    
    return NextResponse.json({ 
      message: 'Correo enviado correctamente',
      messageId: response.data.id
    });
  } catch (error) {
    console.error('DirectSend: Error general', error);
    return NextResponse.json({ 
      error: 'Error al enviar el correo' 
    }, { status: 500 });
  }
}
*/

// Exportar funciones mock para mantener la compatibilidad
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST() {
  return new Response('Gmail functionality is temporarily disabled', { status: 503 });
} 
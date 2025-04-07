import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { getServerSupabase } from '@/lib/supabase/config';

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
    console.log('DirectSend: Iniciando proceso de envío directo de correo');
    
    // 1. Obtener el token de autenticación del usuario actual usando cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    console.log('DirectSend: Obteniendo sesión del usuario...');
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('DirectSend: Error al obtener la sesión:', authError);
      return NextResponse.json({ error: 'Error al obtener la sesión: ' + authError.message }, { status: 500 });
    }
    
    let user = null;
    let token = null;

    // Si no hay sesión, intentar obtener el token de los encabezados
    if (!sessionData?.session) {
      console.log('DirectSend: No se encontró sesión en cookies, intentando encabezados...');
      
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
        
        try {
          // Verificar el token con Supabase
          const { data: userData, error: userError } = await supabase.auth.getUser(token);
          
          if (userError || !userData.user) {
            console.error('DirectSend: Token inválido:', userError);
          } else {
            console.log('DirectSend: Usuario encontrado por token en encabezados');
            user = userData.user;
          }
        } catch (error) {
          console.error('DirectSend: Error al verificar token:', error);
        }
      } else {
        console.log('DirectSend: No se encontró encabezado de autorización');
      }
      
      // Si aún no hay usuario, devolver error 401
      if (!user) {
        console.error('DirectSend: No se pudo autenticar al usuario por ningún medio');
        return NextResponse.json({ 
          error: 'No se encontró sesión de usuario. Por favor, inicia sesión nuevamente.' 
        }, { status: 401 });
      }
    } else {
      user = sessionData.session.user;
      token = sessionData.session.access_token;
      console.log('DirectSend: Sesión obtenida correctamente', { userId: user.id });
    }
    
    // 2. Obtener los datos del correo electrónico
    console.log('DirectSend: Leyendo datos del correo');
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
    try {
      let sentMessage;
      try {
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });
        sentMessage = response.data;
      } catch (sendError: any) {
        // Si el error es de autenticación, intentar refrescar el token
        if (sendError.code === 401 || (sendError.response?.status === 401)) {
          console.log('DirectSend: Token expirado, intentando refrescar...');
          
          try {
            // Refrescar token de OAuth2
            console.log('DirectSend: Intentando refrescar token con credenciales:', {
              hasRefreshToken: !!credentials.refresh_token,
              refreshTokenLength: credentials.refresh_token?.length || 0,
              expiryDate: new Date(credentials.expiry_date).toISOString()
            });

            const { credentials: newTokens } = await oauth2Client.refreshAccessToken();
            
            console.log('DirectSend: Token refrescado:', {
              hasNewAccessToken: !!newTokens.access_token,
              newTokenLength: newTokens.access_token?.length || 0,
              newExpiryDate: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : 'N/A'
            });

            if (!newTokens.access_token) {
              throw new Error('No se pudo obtener un nuevo token de acceso');
            }
            
            // Actualizar credenciales en la base de datos
            const { error: updateError } = await supabase
              .from('gmail_credentials')
              .update({
                access_token: newTokens.access_token,
                expiry_date: newTokens.expiry_date,
              })
              .eq('user_id', user.id);
            
            if (updateError) {
              throw new Error('Error al actualizar credenciales: ' + updateError.message);
            }
            
            // Actualizar cliente con nuevo token
            oauth2Client.setCredentials({
              ...newTokens,
              refresh_token: credentials.refresh_token,
            });
            
            // Reintentar envío con nuevo token
            console.log('DirectSend: Reintentando envío con nuevo token...');
            const retryResponse = await gmail.users.messages.send({
              userId: 'me',
              requestBody: {
                raw: encodedMessage,
              },
            });
            
            sentMessage = retryResponse.data;
          } catch (refreshError) {
            console.error('DirectSend: Error detallado al refrescar token:', {
              error: refreshError,
              message: refreshError instanceof Error ? refreshError.message : String(refreshError),
              stack: refreshError instanceof Error ? refreshError.stack : 'No stack trace available',
              code: (refreshError as any)?.response?.status || (refreshError as any)?.code,
              response: (refreshError as any)?.response?.data
            });

            // Si el error indica que el refresh token es inválido o ha expirado
            if ((refreshError as any)?.response?.status === 400 || 
                (refreshError as any)?.message?.includes('invalid_grant')) {
              // Eliminar las credenciales inválidas
              await supabase
                .from('gmail_credentials')
                .delete()
                .eq('user_id', user.id);

              throw new Error(
                'Las credenciales de Gmail han expirado o han sido revocadas. ' +
                'Por favor, vuelve a conectar tu cuenta de Gmail.'
              );
            }

            throw new Error(
              'Error al refrescar credenciales de Gmail: ' +
              (refreshError instanceof Error ? refreshError.message : String(refreshError))
            );
          }
        } else {
          throw sendError;
        }
      }
      
      console.log('DirectSend: Correo enviado correctamente', {
        messageId: sentMessage.id
      });
      
      // 7. Guardar registro del correo enviado
      console.log('DirectSend: Guardando registro del correo enviado');
      const { error: saveError } = await supabase
        .from('emails')
        .insert({
          user_id: user.id,
          subject: subject,
          body: body,
          to_emails: to,
          status: 'sent',
          direction: 'outbound',
          sent_at: new Date().toISOString(),
          message_id: sentMessage.id,
          thread_id: sentMessage.threadId,
        });
      
      if (saveError) {
        console.error('DirectSend: Error al guardar registro del correo enviado', saveError);
        // No devolvemos error, ya que el correo se envió correctamente
      }
      
      return NextResponse.json({
        success: true,
        message: 'Correo enviado correctamente',
        messageId: sentMessage.id
      });
      
    } catch (error) {
      console.error('DirectSend: Error general', {
        error: error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack available'
      });
      
      return NextResponse.json({ 
        error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error)) 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('DirectSend: Error general', {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack available'
    });
    
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 });
  }
} 
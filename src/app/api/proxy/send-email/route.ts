import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getServerSupabase } from '@/lib/supabase/config';

export async function POST(request: Request) {
  try {
    // 1. Obtener el token de autenticación del usuario actual usando cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    console.log('Proxy: Obteniendo sesión del usuario...');
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Proxy: Error al obtener la sesión:', authError);
      return NextResponse.json({ error: 'Error al obtener la sesión: ' + authError.message }, { status: 500 });
    }
    
    if (!sessionData?.session) {
      console.error('Proxy: No se encontró sesión de usuario');
      
      // Intentar obtener la sesión de los encabezados de la solicitud como alternativa
      console.log('Proxy: Intentando obtener token de los encabezados...');
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader) {
        console.error('Proxy: No se encontró encabezado de autorización');
        
        // Como último recurso, usamos el rol de servicio de Supabase
        console.log('Proxy: Usando rol de servicio como alternativa...');
        
        try {
          const serviceClient = getServerSupabase();
          const body = await request.json();
          
          // URL de la función Edge
          const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`;
          
          console.log('Proxy: Enviando solicitud a la función Edge con rol de servicio');
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'x-client-info': 'proxy-service-role'
            },
            body: JSON.stringify(body)
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Proxy: Error en la función Edge (rol de servicio):', data);
            return NextResponse.json({ error: data.error || 'Error al enviar el correo' }, { status: response.status });
          }
          
          console.log('Proxy: Respuesta exitosa de la función Edge (rol de servicio)');
          return NextResponse.json(data);
        } catch (serviceError) {
          console.error('Proxy: Error al usar rol de servicio:', serviceError);
          return NextResponse.json({ 
            error: 'Error en la autenticación: ' + (serviceError instanceof Error ? serviceError.message : String(serviceError))
          }, { status: 500 });
        }
      }
      
      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'Token de autenticación no proporcionado' }, { status: 401 });
      }
      
      console.log('Proxy: Token obtenido de los encabezados');
      
      try {
        // Verificar que el token sea válido
        const { data: userData, error: verifyError } = await supabase.auth.getUser(token);
        
        if (verifyError || !userData.user) {
          console.error('Proxy: Token inválido:', verifyError);
          return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }
        
        const body = await request.json();
        
        // URL de la función Edge
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`;
        
        console.log('Proxy: Enviando solicitud a la función Edge con token de encabezado');
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error('Proxy: Error en la función Edge (token encabezado):', data);
          return NextResponse.json({ error: data.error || 'Error al enviar el correo' }, { status: response.status });
        }
        
        console.log('Proxy: Respuesta exitosa de la función Edge (token encabezado)');
        return NextResponse.json(data);
      } catch (tokenError) {
        console.error('Proxy: Error al verificar token de encabezado:', tokenError);
        return NextResponse.json({ 
          error: 'Error al verificar token: ' + (tokenError instanceof Error ? tokenError.message : String(tokenError))
        }, { status: 500 });
      }
    }
    
    // Si llegamos aquí, tenemos una sesión válida
    const token = sessionData.session.access_token;
    console.log('Proxy: Sesión obtenida correctamente');
    
    // Obtener los datos del correo electrónico desde la solicitud
    const body = await request.json();
    
    // URL de la función Edge
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`;
    
    // Realizar la solicitud a la función Edge desde el servidor
    console.log('Proxy: Enviando solicitud a la función Edge');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    
    // Obtener la respuesta de la función Edge
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Proxy: Error en la función Edge:', data);
      return NextResponse.json({ error: data.error || 'Error al enviar el correo' }, { status: response.status });
    }
    
    // Devolver la respuesta exitosa
    console.log('Proxy: Respuesta exitosa de la función Edge');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy: Error general:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

// También manejar solicitudes OPTIONS para el proxy
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 
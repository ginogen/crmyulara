import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Obtener el token de autenticación del usuario actual usando cookies
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    console.log('Test Proxy: Obteniendo sesión del usuario...');
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Test Proxy: Error al obtener la sesión:', authError);
      return NextResponse.json({ error: 'Error al obtener la sesión: ' + authError.message }, { status: 500 });
    }
    
    // Mostrar información sobre la sesión
    console.log('Test Proxy: Información de sesión:', {
      hasSession: !!sessionData?.session,
      userId: sessionData?.session?.user?.id,
      tokenLength: sessionData?.session?.access_token?.length || 0,
      expires: sessionData?.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'N/A'
    });
    
    if (!sessionData?.session) {
      console.error('Test Proxy: No se encontró sesión de usuario');
      return NextResponse.json({ error: 'No se encontró sesión de usuario' }, { status: 401 });
    }
    
    // Obtener token
    const token = sessionData.session.access_token;
    console.log('Test Proxy: Sesión obtenida correctamente');
    
    // Obtener los datos de la solicitud
    const body = await request.json();
    console.log('Test Proxy: Cuerpo de la solicitud:', body);
    
    // URL de la función Edge
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`;
    
    // Enviar una solicitud simplificada a la función Edge
    console.log('Test Proxy: Enviando solicitud a la función Edge con datos simplificados');
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: ['prueba@ejemplo.com'],
        subject: 'Prueba simplificada',
        body: '<p>Esto es una prueba simplificada</p>'
      })
    });
    
    // Obtener la respuesta de la función Edge
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Test Proxy: Error al parsear la respuesta JSON:', parseError);
      return NextResponse.json({ 
        error: 'Error al parsear la respuesta', 
        responseText: await response.text() 
      }, { status: 500 });
    }
    
    if (!response.ok) {
      console.error('Test Proxy: Error en la función Edge:', data);
      return NextResponse.json({ 
        error: data.error || 'Error al enviar el correo',
        status: response.status,
        statusText: response.statusText,
        details: data
      }, { status: response.status });
    }
    
    // Devolver la respuesta exitosa
    console.log('Test Proxy: Respuesta exitosa de la función Edge');
    return NextResponse.json({
      success: true,
      message: 'Prueba de conexión con la función Edge exitosa',
      functionResponse: data
    });
    
  } catch (error) {
    console.error('Test Proxy: Error general:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error)),
      stack: error instanceof Error ? error.stack : undefined
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
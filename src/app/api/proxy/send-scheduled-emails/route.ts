import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // Obtener el token de autenticación del usuario actual
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const token = session.access_token;
    
    // URL de la función Edge
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-scheduled-emails`;
    
    // Realizar la solicitud a la función Edge desde el servidor
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Obtener la respuesta de la función Edge
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error en la función Edge:', data);
      return NextResponse.json({ error: data.error || 'Error al procesar los correos programados' }, { status: response.status });
    }
    
    // Devolver la respuesta exitosa
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error en el proxy:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}

// También manejar solicitudes OPTIONS para el proxy
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
} 
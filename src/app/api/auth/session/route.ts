import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Endpoint para verificar el estado de la sesión
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    console.log('Auth: Verificando sesión...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth: Error al obtener sesión:', error);
      return NextResponse.json({
        status: 'error',
        error: error.message,
      }, { status: 500 });
    }
    
    if (!data.session) {
      console.log('Auth: No hay sesión activa');
      return NextResponse.json({
        status: 'unauthenticated',
        session: null
      });
    }
    
    // Devolver información de sesión (sin exponer tokens completos)
    const sessionInfo = {
      status: 'authenticated',
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        created_at: data.session.user.created_at,
        last_sign_in_at: data.session.user.last_sign_in_at
      },
      expires_at: data.session.expires_at,
      token_preview: data.session.access_token ? 
        `${data.session.access_token.substring(0, 10)}...` : 
        null,
      token_length: data.session.access_token?.length || 0
    };
    
    console.log('Auth: Sesión activa encontrada', {
      userId: data.session.user.id,
      tokenLength: data.session.access_token?.length || 0
    });
    
    return NextResponse.json(sessionInfo);
  } catch (error) {
    console.error('Auth: Error interno al verificar sesión:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
} 
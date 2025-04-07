import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Endpoint para refrescar la sesión
export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    console.log('Auth: Intentando refrescar sesión...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Auth: Error al refrescar sesión:', error);
      return NextResponse.json({
        status: 'error',
        error: error.message,
      }, { status: 500 });
    }
    
    if (!data.session) {
      console.log('Auth: No se pudo obtener una nueva sesión');
      return NextResponse.json({
        status: 'unauthenticated',
        session: null
      }, { status: 401 });
    }
    
    // Devolver información de la sesión refrescada (sin exponer tokens completos)
    const sessionInfo = {
      status: 'refreshed',
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
      expires_at: data.session.expires_at,
      token_preview: data.session.access_token ? 
        `${data.session.access_token.substring(0, 10)}...` : 
        null,
      token_length: data.session.access_token?.length || 0
    };
    
    console.log('Auth: Sesión refrescada correctamente', {
      userId: data.session.user.id,
      tokenLength: data.session.access_token?.length || 0,
      expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'N/A'
    });
    
    return NextResponse.json(sessionInfo);
  } catch (error) {
    console.error('Auth: Error interno al refrescar sesión:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
} 
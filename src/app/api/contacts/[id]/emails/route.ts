import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener los correos del contacto
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('*')
      .contains('contact_ids', [params.id])
      .order('created_at', { ascending: false });

    if (emailsError) {
      throw emailsError;
    }

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Error obteniendo correos del contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 
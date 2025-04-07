import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REGISTER_PASSWORD = 'yulara_2025!';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rutas públicas que no requieren autenticación
  const publicRoutes = [
    '/auth/login', 
    '/auth/register', 
    '/auth/verify-email', 
    '/auth/callback',
    '/api/webhooks/make',
  ];
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);

  // Si el usuario no está autenticado y la ruta no es pública
  if (!session && !isPublicRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Si el usuario está autenticado y trata de acceder a rutas de auth
  if (session && isPublicRoute && !req.nextUrl.pathname.startsWith('/api/webhooks')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 
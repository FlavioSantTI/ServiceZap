import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não exigem autenticação
const PUBLIC_PATHS = [
  '/',
  '/campanha',
  '/piloto',
  '/login',
  '/api/webhooks',
  '/api/whatsapp/status',
  '/api/whatsapp/send-media',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos, assets e Next.js internos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Verificar se é uma rota pública conhecida
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // Obter cookies de autenticação (Appwrite session ou cookie de demo)
  const sessionCookie = request.cookies.get('appwrite-session');
  const demoRoleCookie = request.cookies.get('servicezap-user-role');
  const isAuthenticated = Boolean(sessionCookie || demoRoleCookie);
  const userRole = demoRoleCookie?.value || 'user';

  // 1. Proteger rotas do Dashboard (/dashboard/*)
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Proteger rotas do Super Admin (/super-admin/*)
  if (pathname.startsWith('/super-admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Se autenticado mas não é super_admin, redireciona para o dashboard normal
    if (userRole !== 'super_admin' && userRole !== 'master') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 3. Se usuário autenticado tenta acessar /login -> redireciona conforme o perfil
  if (pathname === '/login' && isAuthenticated) {
    const targetPath = (userRole === 'super_admin' || userRole === 'master') ? '/super-admin' : '/dashboard';
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/super-admin/:path*',
    '/login',
  ],
};

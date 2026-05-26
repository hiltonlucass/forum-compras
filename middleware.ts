import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rotas que exigem autenticação
const protectedRoutes = ['/posts/novo', '/perfil'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verifica se a rota é protegida
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Também protege rotas de edição
  const isEditRoute = /^\/posts\/[^/]+\/editar$/.test(pathname);

  if (!isProtected && !isEditRoute) {
    return NextResponse.next();
  }

  // Verifica se existe token de sessão nos cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Busca o token de acesso dos cookies do Supabase
  const accessToken = request.cookies.get('sb-access-token')?.value
    || request.cookies.get(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`)?.value;

  // Se não há nenhum cookie de auth, verifica o localStorage via header
  // Como middleware não tem acesso ao localStorage, verificamos apenas cookies
  // A proteção principal fica no componente AuthGuard (client-side)
  
  // Para o middleware, fazemos uma verificação leve:
  // Se a rota é protegida e não há indicação de sessão, redireciona
  const authCookies = Array.from(request.cookies.getAll()).filter(
    (cookie) => cookie.name.includes('auth-token') || cookie.name.includes('sb-')
  );

  if (authCookies.length === 0) {
    // Sem cookies de auth — redireciona para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/posts/novo', '/perfil', '/posts/:id/editar'],
};

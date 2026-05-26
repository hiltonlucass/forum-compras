'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import UserAvatar from './UserAvatar';
import Notifications from './Notifications';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; avatar: string | null } | null>(null);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 2);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('nome, avatar_url')
          .eq('id', session.user.id)
          .single();

        setUser({
          name: data?.nome || session.user.email || 'U',
          avatar: data?.avatar_url || null,
        });
      }
    }

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) checkUser();
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={`bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-shadow ${
        scrolled ? 'shadow-header' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-heading font-bold text-xs">FC</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-semibold text-sm text-text-primary dark:text-white">
                Fórum de Compras
              </span>
              <span className="text-[10px] text-text-secondary ml-1.5 hidden md:inline">
                OutSystems
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/"
              className="text-sm text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 px-3 py-1.5 rounded-md transition-colors"
            >
              Início
            </Link>
            <Link
              href="/posts/novo"
              className="text-sm text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 px-3 py-1.5 rounded-md transition-colors"
            >
              Novo Post
            </Link>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
            <ThemeToggle />
            <Notifications />
            {user ? (
              <Link href="/perfil" className="ml-1">
                <UserAvatar name={user.name} avatarUrl={user.avatar} size="sm" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Entrar
              </Link>
            )}
          </nav>

          {/* Mobile */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle />
            {user && (
              <Link href="/perfil">
                <UserAvatar name={user.name} avatarUrl={user.avatar} size="sm" />
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-1">
            <Link href="/" className="text-sm text-text-secondary hover:text-primary-600 px-3 py-2 rounded-md" onClick={() => setMobileMenuOpen(false)}>
              Início
            </Link>
            <Link href="/posts/novo" className="text-sm text-text-secondary hover:text-primary-600 px-3 py-2 rounded-md" onClick={() => setMobileMenuOpen(false)}>
              Novo Post
            </Link>
            {!user && (
              <Link href="/login" className="text-sm text-text-secondary hover:text-primary-600 px-3 py-2 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                Entrar
              </Link>
            )}
            {user && (
              <Link href="/perfil" className="text-sm text-text-secondary hover:text-primary-600 px-3 py-2 rounded-md" onClick={() => setMobileMenuOpen(false)}>
                Meu Perfil
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

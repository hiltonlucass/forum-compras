'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import UserAvatar from './UserAvatar';

interface ProfileData {
  nome: string;
  cargo: string;
  avatar_url: string | null;
}

export default function ProfileCard() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('nome, cargo, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        // Fallback com dados do auth
        setProfile({
          nome: session.user.user_metadata?.full_name || session.user.email || 'Usuário',
          cargo: session.user.user_metadata?.cargo || '',
          avatar_url: null,
        });
      }

      setLoading(false);
    }

    fetchProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!profile) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Entrar
      </Link>
    );
  }

  return (
    <Link
      href="/perfil"
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <UserAvatar name={profile.nome} avatarUrl={profile.avatar_url} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {profile.nome}
        </p>
        {profile.cargo && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {profile.cargo}
          </p>
        )}
      </div>
    </Link>
  );
}

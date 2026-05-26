'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Sincroniza a sessão do Supabase com cookies para que o middleware
 * do Next.js possa verificar autenticação no servidor.
 */
export default function AuthSync() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Salva um cookie indicando que o usuário está autenticado
        document.cookie = `sb-auth-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      } else {
        // Remove o cookie ao fazer logout
        document.cookie = 'sb-auth-token=; path=/; max-age=0';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

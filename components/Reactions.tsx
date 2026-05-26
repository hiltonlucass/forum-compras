'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ReactionsProps {
  postId: string;
}

const REACTION_TYPES = [
  { tipo: 'util', label: 'Útil', emoji: '👍' },
  { tipo: 'resolvido', label: 'Resolveu', emoji: '✅' },
  { tipo: 'duvida', label: 'Tenho dúvida', emoji: '❓' },
];

export default function Reactions({ postId }: ReactionsProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Buscar contagens
      const { data: reactions } = await supabase
        .from('reacoes')
        .select('tipo, autor_id')
        .eq('post_id', postId);

      if (reactions) {
        const c: Record<string, number> = {};
        reactions.forEach((r: any) => {
          c[r.tipo] = (c[r.tipo] || 0) + 1;
        });
        setCounts(c);
      }

      // Verificar reações do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        if (reactions) {
          const mine = reactions
            .filter((r: any) => r.autor_id === user.id)
            .map((r: any) => r.tipo);
          setUserReactions(mine);
        }
      }
    }

    init();
  }, [postId]);

  async function toggleReaction(tipo: string) {
    if (!userId) return;

    const hasReacted = userReactions.includes(tipo);

    if (hasReacted) {
      // Remover reação
      await supabase
        .from('reacoes')
        .delete()
        .eq('post_id', postId)
        .eq('autor_id', userId)
        .eq('tipo', tipo);

      setUserReactions((prev) => prev.filter((t) => t !== tipo));
      setCounts((prev) => ({ ...prev, [tipo]: (prev[tipo] || 1) - 1 }));
    } else {
      // Adicionar reação
      await supabase.from('reacoes').insert({
        post_id: postId,
        autor_id: userId,
        tipo,
      });

      setUserReactions((prev) => [...prev, tipo]);
      setCounts((prev) => ({ ...prev, [tipo]: (prev[tipo] || 0) + 1 }));
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTION_TYPES.map((r) => {
        const isActive = userReactions.includes(r.tipo);
        const count = counts[r.tipo] || 0;

        return (
          <button
            key={r.tipo}
            onClick={() => toggleReaction(r.tipo)}
            disabled={!userId}
            title={!userId ? 'Faça login para reagir' : r.label}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span>{r.emoji}</span>
            <span className="font-medium">{r.label}</span>
            {count > 0 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

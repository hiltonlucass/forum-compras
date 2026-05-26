'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';

interface HistoryEntry {
  id: string;
  titulo: string;
  conteudo: string;
  criado_em: string;
}

interface PostHistoryProps {
  postId: string;
}

export default function PostHistory({ postId }: PostHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<HistoryEntry | null>(null);
  const [currentContent, setCurrentContent] = useState('');

  useEffect(() => {
    if (!open) return;

    async function fetchHistory() {
      const { data: versions } = await supabase
        .from('post_historico')
        .select('*')
        .eq('post_id', postId)
        .order('criado_em', { ascending: false });

      if (versions) setHistory(versions);

      // Buscar conteúdo atual para comparação
      const { data: post } = await supabase
        .from('posts')
        .select('conteudo')
        .eq('id', postId)
        .single();

      if (post) setCurrentContent(post.conteudo);
    }

    fetchHistory();
  }, [postId, open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Histórico
      </button>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-semibold text-text-primary dark:text-white">
          Histórico de edições ({history.length})
        </h3>
        <button
          onClick={() => { setOpen(false); setSelectedVersion(null); }}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Fechar
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhuma edição anterior registrada.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setSelectedVersion(entry)}
              className={`text-left p-3 rounded-lg border transition-colors ${
                selectedVersion?.id === entry.id
                  ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800'
              }`}
            >
              <p className="text-sm font-medium text-text-primary dark:text-white">
                {entry.titulo}
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Editado em {formatDate(entry.criado_em)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Diff view */}
      {selectedVersion && (
        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-text-secondary">
              Versão de {formatDate(selectedVersion.criado_em)}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-red-500 font-semibold mb-2">
                Versão anterior
              </p>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-sm opacity-70"
                dangerouslySetInnerHTML={{ __html: selectedVersion.conteudo }}
              />
            </div>
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-green-500 font-semibold mb-2">
                Versão atual
              </p>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: currentContent }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

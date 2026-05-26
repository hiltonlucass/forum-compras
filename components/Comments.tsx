'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';
import UserAvatar from './UserAvatar';

interface Comment {
  id: string;
  conteudo: string;
  criado_em: string;
  autor_id: string;
  profiles: { nome: string; avatar_url: string | null };
}

interface CommentsProps {
  postId: string;
}

export default function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchComments();
    checkUser();
  }, [postId]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();
      setUserName(profile?.nome || user.email || '');
    }
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comentarios')
      .select(`
        id, conteudo, criado_em, autor_id,
        profiles:autor_id (nome, avatar_url)
      `)
      .eq('post_id', postId)
      .order('criado_em', { ascending: true });

    if (data) setComments(data as any);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;

    setLoading(true);

    const { error } = await supabase.from('comentarios').insert({
      post_id: postId,
      autor_id: userId,
      conteudo: newComment.trim(),
    });

    if (!error) {
      setNewComment('');
      await fetchComments();
    }

    setLoading(false);
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Excluir este comentário?')) return;

    await supabase.from('comentarios').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Comentários ({comments.length})
      </h2>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="flex flex-col gap-4 mb-8">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <UserAvatar
                name={comment.profiles?.nome || 'U'}
                avatarUrl={comment.profiles?.avatar_url}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.profiles?.nome}
                  </span>
                  <time className="text-xs text-gray-400">
                    {formatDate(comment.criado_em)}
                  </time>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {comment.conteudo}
                </p>
                {comment.autor_id === userId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-2"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      )}

      {/* New comment form */}
      {userId ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <UserAvatar name={userName || 'U'} size="sm" />
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={3}
              className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-primary-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <a href="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Faça login
            </a>{' '}
            para comentar.
          </p>
        </div>
      )}
    </div>
  );
}

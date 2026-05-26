'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';
import UserAvatar from '@/components/UserAvatar';
import Reactions from '@/components/Reactions';
import Comments from '@/components/Comments';
import ImageLightbox from '@/components/ImageLightbox';
import ExportPDF from '@/components/ExportPDF';
import PostHistory from '@/components/PostHistory';

interface PostData {
  id: string;
  titulo: string;
  conteudo: string;
  fixado: boolean;
  visualizacoes: number;
  criado_em: string;
  atualizado_em: string;
  autor_id: string;
  profiles: { nome: string; avatar_url: string | null; cargo: string };
  categorias: { nome: string; icone: string };
}

interface PostImage {
  id: string;
  url: string;
  nome_arquivo: string;
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [images, setImages] = useState<PostImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      // Buscar post com joins
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:autor_id (nome, avatar_url, cargo),
          categorias:categoria_id (nome, icone)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        router.push('/');
        return;
      }

      setPost(data as any);

      // Incrementar visualizações
      await supabase
        .from('posts')
        .update({ visualizacoes: (data.visualizacoes || 0) + 1 })
        .eq('id', id);

      // Buscar imagens
      const { data: imgs } = await supabase
        .from('imagens_post')
        .select('*')
        .eq('post_id', id);

      if (imgs) setImages(imgs as any);

      // Verificar usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('cargo')
          .eq('id', user.id)
          .single();

        if (profile?.cargo?.toLowerCase().includes('admin')) {
          setIsAdmin(true);
        }
      }

      setLoading(false);
    }

    fetchPost();
  }, [id, router]);

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) return;

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (!error) {
      router.push('/');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!post) return null;

  const canEdit = userId === post.autor_id || isAdmin;

  return (
    <article className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary-600 dark:hover:text-primary-400">
          Início
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white truncate">{post.titulo}</span>
      </nav>

      {/* Post Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        {/* Header */}
        <header className="mb-6">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.fixado && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                📌 Fixado
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              {post.categorias?.nome}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-5">
            {post.titulo}
          </h1>

          {/* Author */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={post.profiles?.nome || 'U'}
                avatarUrl={post.profiles?.avatar_url}
                size="md"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {post.profiles?.nome}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {post.profiles?.cargo} • {formatDate(post.criado_em)}
                  {post.atualizado_em !== post.criado_em &&
                    ` • Editado ${formatDate(post.atualizado_em)}`}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {post.visualizacoes} visualizações
              </span>
            </div>
          </div>
        </header>

        {/* Divider */}
        <hr className="border-gray-100 dark:border-gray-700 mb-6" />

        {/* Content */}
        <div
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-img:rounded-lg prose-code:bg-gray-100 prose-code:dark:bg-gray-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100"
          dangerouslySetInnerHTML={{ __html: post.conteudo }}
        />

        {/* Image Gallery with Lightbox */}
        <ImageLightbox images={images} />

        {/* Reactions */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          <Reactions postId={post.id} />
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <Link
              href={`/posts/${post.id}/editar`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </Link>
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Excluir
            </button>
            <ExportPDF postId={post.id} title={post.titulo} />
            <PostHistory postId={post.id} />
          </div>
        )}
      </div>

      {/* Comments Section */}
      <Comments postId={post.id} />

      {/* Back link */}
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para o fórum
        </Link>
      </div>
    </article>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';
import CategoryBadge from '@/components/CategoryBadge';
import EmptyState from '@/components/EmptyState';
import { PostListSkeleton } from '@/components/LoadingSkeleton';

interface PostItem {
  id: string;
  titulo: string;
  conteudo: string;
  fixado: boolean;
  visualizacoes: number;
  criado_em: string;
  categoria_id: number;
  profiles: { nome: string; avatar_url: string | null };
  categorias: { nome: string };
  comment_count: number;
  first_image: string | null;
}

interface CategoryCount {
  id: number;
  nome: string;
  count: number;
}

type SortMode = 'recentes' | 'vistos' | 'sem-resposta';

const POSTS_PER_PAGE = 10;

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentCategory = searchParams.get('category');
  const currentSort = (searchParams.get('sort') as SortMode) || 'recentes';
  const currentPage = Number(searchParams.get('page') || '1');
  const currentSearch = searchParams.get('q') || '';
  const showPinned = searchParams.get('fixados') === '1';

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(currentSearch);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('posts')
      .select(`
        id, titulo, conteudo, fixado, visualizacoes, criado_em, categoria_id,
        profiles:autor_id (nome, avatar_url),
        categorias:categoria_id (nome)
      `, { count: 'exact' });

    // Filtros
    if (currentCategory) {
      query = query.eq('categoria_id', Number(currentCategory));
    }

    if (showPinned) {
      query = query.eq('fixado', true);
    }

    if (currentSearch) {
      query = query.or(`titulo.ilike.%${currentSearch}%,conteudo.ilike.%${currentSearch}%`);
    }

    // Ordenação
    if (currentSort === 'vistos') {
      query = query.order('visualizacoes', { ascending: false });
    } else {
      query = query.order('fixado', { ascending: false }).order('criado_em', { ascending: false });
    }

    // Paginação
    const from = (currentPage - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('Erro ao buscar posts:', error);
      setLoading(false);
      return;
    }

    setTotalCount(count || 0);

    // Buscar contagem de comentários e primeira imagem para cada post
    const postIds = (data || []).map((p: any) => p.id);

    let commentCounts: Record<string, number> = {};
    let firstImages: Record<string, string | null> = {};

    if (postIds.length > 0) {
      // Comentários
      const { data: comments } = await supabase
        .from('comentarios')
        .select('post_id')
        .in('post_id', postIds);

      if (comments) {
        comments.forEach((c: any) => {
          commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
        });
      }

      // Primeira imagem
      const { data: imgs } = await supabase
        .from('imagens_post')
        .select('post_id, url')
        .in('post_id', postIds);

      if (imgs) {
        imgs.forEach((img: any) => {
          if (!firstImages[img.post_id]) {
            firstImages[img.post_id] = img.url;
          }
        });
      }
    }

    // Filtro "sem resposta"
    let enrichedPosts = (data || []).map((p: any) => ({
      ...p,
      comment_count: commentCounts[p.id] || 0,
      first_image: firstImages[p.id] || null,
    }));

    if (currentSort === 'sem-resposta') {
      enrichedPosts = enrichedPosts.filter((p) => p.comment_count === 0);
    }

    setPosts(enrichedPosts);
    setLoading(false);
  }, [currentCategory, currentSort, currentPage, currentSearch, showPinned]);

  const fetchCategories = useCallback(async () => {
    const { data: cats } = await supabase
      .from('categorias')
      .select('id, nome')
      .order('nome');

    if (!cats) return;

    // Contar posts por categoria
    const { data: postCounts } = await supabase
      .from('posts')
      .select('categoria_id');

    const counts: Record<number, number> = {};
    if (postCounts) {
      postCounts.forEach((p: any) => {
        counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1;
      });
    }

    setCategories(
      cats.map((c: any) => ({ id: c.id, nome: c.nome, count: counts[c.id] || 0 }))
    );
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [fetchPosts, fetchCategories]);

  function buildUrl(params: Record<string, string | null>) {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) sp.delete(key);
      else sp.set(key, value);
    });
    // Reset page when changing filters
    if (!params.page) sp.delete('page');
    return `/?${sp.toString()}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ q: search || null, page: null }));
  }

  function getExcerpt(html: string, max = 120): string {
    const text = html.replace(/<[^>]+>/g, '');
    return text.length > max ? text.slice(0, max).trim() + '...' : text;
  }

  return (
    <div>
      {/* Mobile Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar posts..."
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentSearch
              ? `Resultados para "${currentSearch}"`
              : showPinned
              ? 'Posts Fixados'
              : 'Posts Recentes'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {totalCount} {totalCount === 1 ? 'post encontrado' : 'posts encontrados'}
          </p>
        </div>
        <Link
          href="/posts/novo"
          className="hidden sm:inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Post
        </Link>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {[
          { key: 'recentes', label: 'Recentes', icon: '🕐' },
          { key: 'vistos', label: 'Mais vistos', icon: '👁️' },
          { key: 'sem-resposta', label: 'Sem resposta', icon: '💬' },
        ].map((item) => (
          <Link
            key={item.key}
            href={buildUrl({ sort: item.key === 'recentes' ? null : item.key })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              currentSort === item.key
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
        <Link
          href={buildUrl({ fixados: showPinned ? null : '1', sort: null })}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            showPinned
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span>📌</span>
          Fixados
        </Link>
      </div>

      {/* Loading */}
      {loading ? (
        <PostListSkeleton count={5} />
      ) : posts.length > 0 ? (
        <>
          {/* Posts List */}
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 group"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {post.first_image && (
                    <Link
                      href={`/posts/${post.id}`}
                      className="hidden sm:block flex-shrink-0"
                    >
                      <img
                        src={post.first_image}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover border border-gray-100 dark:border-gray-700"
                      />
                    </Link>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                          {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <span className="text-primary-700 dark:text-primary-300 font-semibold text-[10px]">
                              {post.profiles?.nome?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {post.profiles?.nome}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">•</span>
                      <time className="text-xs text-gray-400">{formatDate(post.criado_em)}</time>
                    </div>

                    {/* Title */}
                    <Link href={`/posts/${post.id}`}>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-1">
                        {post.fixado && <span className="mr-1.5 text-sm">📌</span>}
                        {post.titulo}
                      </h3>
                    </Link>

                    {/* Excerpt */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {getExcerpt(post.conteudo)}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <CategoryBadge name={post.categorias?.nome || ''} />
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {post.visualizacoes || 0}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {post.comment_count}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Link
                href={buildUrl({ page: currentPage > 1 ? String(currentPage - 1) : '1' })}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  currentPage <= 1
                    ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 pointer-events-none'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                ← Anterior
              </Link>

              <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
                {currentPage} de {totalPages}
              </span>

              <Link
                href={buildUrl({ page: currentPage < totalPages ? String(currentPage + 1) : String(totalPages) })}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  currentPage >= totalPages
                    ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 pointer-events-none'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Próxima →
              </Link>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={currentSearch ? 'Nenhum resultado encontrado' : 'Nenhum post ainda'}
          description={currentSearch ? 'Tente buscar com outros termos.' : 'Seja o primeiro a compartilhar conhecimento com o time.'}
          showAction={!currentSearch}
        />
      )}
    </div>
  );
}
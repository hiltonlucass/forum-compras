'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import Toast from '@/components/Toast';
import AuthGuard from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';

interface Category {
  id: number;
  nome: string;
}

interface UploadedImage {
  url: string;
  name: string;
  id: string;
}

export default function EditarPostPage() {
  return (
    <AuthGuard>
      <EditarPostContent />
    </AuthGuard>
  );
}

function EditarPostContent() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [pinned, setPinned] = useState(false);

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function init() {
      // Buscar categorias
      const { data: cats } = await supabase
        .from('categorias')
        .select('id, nome')
        .order('nome');

      if (cats) setCategories(cats);

      // Verificar se é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('cargo')
          .eq('id', user.id)
          .single();

        if (profile?.cargo?.toLowerCase().includes('admin')) {
          setIsAdmin(true);
        }
      }

      // Buscar post
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !post) {
        setToast({ message: 'Post não encontrado.', type: 'error' });
        setFetching(false);
        return;
      }

      setTitle(post.titulo);
      setContent(post.conteudo);
      setCategoryId(post.categoria_id);
      setPinned(post.fixado || false);

      // Buscar imagens do post
      const { data: postImages } = await supabase
        .from('imagens_post')
        .select('*')
        .eq('post_id', id);

      if (postImages) {
        setImages(
          postImages.map((img: any) => ({
            url: img.url,
            name: img.nome_arquivo || 'imagem',
            id: img.id,
          }))
        );
      }

      setFetching(false);
    }

    init();
  }, [id]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório.';
    } else if (title.length > 150) {
      newErrors.title = `Título muito longo (${title.length}/150 caracteres).`;
    }

    const textContent = content.replace(/<[^>]+>/g, '').trim();
    if (!textContent) {
      newErrors.content = 'Conteúdo é obrigatório.';
    } else if (textContent.length < 50) {
      newErrors.content = `Conteúdo muito curto (${textContent.length}/50 caracteres mínimos).`;
    }

    if (!categoryId) {
      newErrors.category = 'Selecione uma categoria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          titulo: title.trim(),
          conteudo: content,
          categoria_id: categoryId,
          fixado: pinned,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Atualizar imagens: deletar antigas e inserir novas
      await supabase.from('imagens_post').delete().eq('post_id', id);

      if (images.length > 0) {
        const imageRecords = images.map((img) => ({
          post_id: id,
          url: img.url,
          nome_arquivo: img.name,
        }));

        await supabase.from('imagens_post').insert(imageRecords);
      }

      setToast({ message: 'Post atualizado com sucesso!', type: 'success' });

      setTimeout(() => {
        router.push(`/posts/${id}`);
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || 'Erro ao atualizar post.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function handleInsertInline(url: string) {
    if (typeof window !== 'undefined' && (window as any).__editorInsertImage) {
      (window as any).__editorInsertImage(url);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Editar Post
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Atualize o conteúdo do seu post
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 flex flex-col gap-6">
        {/* Título */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
            }}
            maxLength={150}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors ${
              errors.title ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.title && <p className="text-xs text-red-600 dark:text-red-400">{errors.title}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{title.length}/150</p>
          </div>
        </div>

        {/* Categoria */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Categoria <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={categoryId || ''}
            onChange={(e) => {
              setCategoryId(Number(e.target.value));
              if (errors.category) setErrors((prev) => ({ ...prev, category: '' }));
            }}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors appearance-none ${
              errors.category ? 'border-red-400 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '16px',
            }}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.category}</p>}
        </div>

        {/* Conteúdo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Conteúdo <span className="text-red-500">*</span>
          </label>
          {content !== '' && (
            <RichTextEditor
              content={content}
              onChange={(html) => {
                setContent(html);
                if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
              }}
              placeholder="Escreva o conteúdo do seu post..."
            />
          )}
          {errors.content && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.content}</p>}
        </div>

        {/* Imagens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Imagens
          </label>
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            onInsertInline={handleInsertInline}
            maxImages={5}
          />
        </div>

        {/* Fixar post */}
        {isAdmin && (
          <div className="flex items-center gap-3">
            <input
              id="pinned"
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="pinned" className="text-sm text-gray-700 dark:text-gray-300">
              📌 Fixar post no topo
            </label>
          </div>
        )}

        {/* Divider */}
        <hr className="border-gray-100 dark:border-gray-700" />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary-600 text-white text-sm font-medium px-8 py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando...
              </span>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

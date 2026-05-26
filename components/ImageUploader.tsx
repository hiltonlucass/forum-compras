'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface UploadedImage {
  url: string;
  name: string;
  id: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onInsertInline?: (url: string) => void;
  maxImages?: number;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function ImageUploader({
  images,
  onImagesChange,
  onInsertInline,
  maxImages = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" — formato não suportado. Use PNG, JPG, GIF ou WEBP.`;
    }
    if (file.size > MAX_SIZE) {
      return `"${file.name}" — excede 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB).`;
    }
    return null;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError('');

    // Verifica limite
    if (images.length + files.length > maxImages) {
      setError(`Máximo de ${maxImages} imagens por post.`);
      return;
    }

    // Valida cada arquivo
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploading(true);
    setProgress(0);

    const newImages: UploadedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      setProgress(Math.round(((i) / files.length) * 100));

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) {
        setError(`Erro ao enviar "${file.name}": ${uploadError.message}`);
        break;
      }

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      newImages.push({
        url: urlData.publicUrl,
        name: file.name,
        id: fileName,
      });

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    onImagesChange([...images, ...newImages]);
    setUploading(false);
    setProgress(0);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function removeImage(id: string) {
    onImagesChange(images.filter((img) => img.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          uploading
            ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10'
            : 'border-gray-200 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          onChange={handleUpload}
          disabled={uploading || images.length >= maxImages}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Enviando... {progress}%
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {images.length >= maxImages
                ? `Limite de ${maxImages} imagens atingido`
                : 'Clique ou arraste imagens aqui'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              PNG, JPG, GIF, WEBP — máx 5MB cada
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-24 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {onInsertInline && (
                  <button
                    type="button"
                    onClick={() => onInsertInline(img.url)}
                    className="bg-white text-gray-800 text-xs px-2 py-1 rounded shadow"
                    title="Inserir no texto"
                  >
                    Inserir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate px-2 py-1">
                {img.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        {images.length}/{maxImages} imagens
      </p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import UserAvatar from '@/components/UserAvatar';
import { formatDate } from '@/lib/helpers';

interface ProfileData {
  nome: string;
  cargo: string;
  avatar_url: string | null;
  criado_em: string;
}

function PerfilContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setNome(data.nome || '');
        setCargo(data.cargo || '');
        setAvatarUrl(data.avatar_url || '');
      }

      setLoading(false);
    }

    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          nome,
          cargo,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Perfil atualizado com sucesso!');
      setProfile((prev) => prev ? { ...prev, nome, cargo, avatar_url: avatarUrl || null } : null);
    } catch (err: any) {
      setMessage('Erro: ' + (err.message || 'Falha ao salvar.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(`avatars/${fileName}`, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(`avatars/${fileName}`);

      setAvatarUrl(urlData.publicUrl);
    } catch (err: any) {
      setMessage('Erro ao enviar imagem: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Meu Perfil
      </h1>

      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6"
      >
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <UserAvatar
            name={nome || 'U'}
            avatarUrl={avatarUrl || null}
            size="lg"
          />
          <div>
            <label className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium cursor-pointer hover:underline">
              {uploading ? 'Enviando...' : 'Alterar foto'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              JPG, PNG ou GIF. Máx 2MB.
            </p>
          </div>
        </div>

        {/* Nome */}
        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nome completo
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
          />
        </div>

        {/* Cargo */}
        <div>
          <label
            htmlFor="cargo"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Cargo
          </label>
          <input
            id="cargo"
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Desenvolvedor OutSystems"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
          />
        </div>

        {/* Info */}
        {profile?.criado_em && (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Membro desde {formatDate(profile.criado_em)}
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`text-sm p-3 rounded-lg ${
              message.startsWith('Erro')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            }`}
          >
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Sair da conta
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <AuthGuard>
      <PerfilContent />
    </AuthGuard>
  );
}

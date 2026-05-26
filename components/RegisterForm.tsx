'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterForm({ onToggle }: { onToggle: () => void }) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [cargo, setCargo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            cargo: cargo,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        setError('Erro ao criar conta. Tente novamente.');
        return;
      }

      // Se o Supabase exige confirmação de e-mail
      if (authData.user && !authData.session) {
        setError('');
        alert('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
        onToggle(); // Volta para tela de login
        setLoading(false);
        return;
      }

      // 2. Criar perfil na tabela profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        nome: fullName,
        cargo: cargo || 'Desenvolvedor OutSystems',
      });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Não bloqueia — o trigger do banco pode ter criado
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Nome completo
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="João da Silva"
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
        />
      </div>

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

      <div>
        <label
          htmlFor="reg-email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          E-mail
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="seu.email@empresa.com"
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="reg-password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Senha
        </label>
        <input
          id="reg-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !email || !password || !fullName}
        className="w-full bg-primary-600 text-white text-sm font-medium py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? 'Criando conta...' : 'Criar conta'}
      </button>

      <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
        Já tem conta?{' '}
        <button
          type="button"
          onClick={onToggle}
          className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
        >
          Fazer login
        </button>
      </p>
    </form>
  );
}

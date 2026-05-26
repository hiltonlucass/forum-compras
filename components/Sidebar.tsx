'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProfileCard from './ProfileCard';

interface CategoryCount {
  id: number;
  nome: string;
  count: number;
}

const menuItems = [
  { name: 'Dashboard', icon: '📊' },
  { name: 'Busca', icon: '🔍' },
  { name: 'Requisições', icon: '📝' },
  { name: 'Gerenciador', icon: '⚙️' },
  { name: 'Pedidos', icon: '📦' },
  { name: 'Medições', icon: '📏' },
  { name: 'Contratos Criados', icon: '📄' },
  { name: 'Contratos Recebidos', icon: '📥' },
  { name: 'Central de Importações', icon: '🌐' },
  { name: 'Follow-Up', icon: '🔔' },
  { name: 'SLA', icon: '⏱️' },
  { name: 'Minhas Aprovações', icon: '✅' },
  { name: 'Pedidos Recebidos', icon: '📬' },
  { name: 'Compartilhados Comigo', icon: '🤝' },
];

export default function Sidebar() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const { data: cats } = await supabase.from('categorias').select('id, nome').order('nome');
      if (!cats) return;

      const { data: postCounts } = await supabase.from('posts').select('categoria_id');
      const counts: Record<number, number> = {};
      if (postCounts) {
        postCounts.forEach((p: any) => { counts[p.categoria_id] = (counts[p.categoria_id] || 0) + 1; });
      }

      setCategories(cats.map((c: any) => ({ id: c.id, nome: c.nome, count: counts[c.id] || 0 })));
    }
    fetchCategories();
  }, []);

  function getCategoryForItem(itemName: string): CategoryCount | undefined {
    return categories.find((c) => c.nome.toLowerCase() === itemName.toLowerCase());
  }

  function isItemActive(itemName: string): boolean {
    const cat = getCategoryForItem(itemName);
    return cat ? currentCategory === String(cat.id) : false;
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a2332] overflow-hidden">
      {/* Module header */}
      <div className="flex items-center gap-2.5 px-5 h-12 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <span className="text-base">🛒</span>
        <h2 className="font-heading text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
          Compra
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 flex flex-col gap-0.5">
        {/* All posts */}
        <Link
          href="/"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
            !currentCategory
              ? 'bg-primary-600/10 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 hover:text-text-primary dark:hover:text-white'
          }`}
        >
          <span className="text-sm">📋</span>
          <span className="flex-1">Todos</span>
          <span className="text-[11px] text-text-secondary/70 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-medium">
            {categories.reduce((a, c) => a + c.count, 0)}
          </span>
        </Link>

        <div className="h-px bg-gray-100 dark:bg-white/5 my-1.5 mx-2" />

        {/* Menu items */}
        {menuItems.map((item) => {
          const cat = getCategoryForItem(item.name);
          const isActive = isItemActive(item.name);
          const isExpanded = expandedItem === item.name;

          return (
            <div key={item.name}>
              <button
                onClick={() => setExpandedItem(isExpanded ? null : item.name)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                  isActive
                    ? 'bg-primary-600/10 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium'
                    : 'text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5 hover:text-text-primary dark:hover:text-white'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="flex-1 text-left truncate">{item.name}</span>
                {cat && cat.count > 0 && (
                  <span className="text-[11px] text-text-secondary/70 bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-medium">
                    {cat.count}
                  </span>
                )}
                <svg
                  className={`w-3 h-3 text-text-secondary/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Submenu */}
              {isExpanded && cat && (
                <div className="ml-7 mt-0.5 mb-1 flex flex-col gap-0.5 border-l-2 border-primary-200 dark:border-primary-800 pl-2.5">
                  <Link
                    href={`/?category=${cat.id}`}
                    className="text-[12px] px-2 py-1.5 rounded-md text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    Ver posts ({cat.count})
                  </Link>
                  <Link
                    href={`/posts/novo?cat=${cat.id}`}
                    className="text-[12px] px-2 py-1.5 rounded-md text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    Novo post
                  </Link>
                  <Link
                    href={`/?category=${cat.id}&sort=vistos`}
                    className="text-[12px] px-2 py-1.5 rounded-md text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    Mais vistos
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-800 p-3 flex flex-col gap-2 flex-shrink-0">
        <Link
          href="/posts/novo"
          className="flex items-center justify-center gap-2 bg-accent-400 hover:bg-accent-500 text-white text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Post
        </Link>
        <ProfileCard />
      </div>
    </aside>
  );
}

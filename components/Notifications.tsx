'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/helpers';

interface Notification {
  id: string;
  tipo: string;
  mensagem: string;
  post_id: string | null;
  lida: boolean;
  criado_em: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      fetchNotifications(user.id);
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchNotifications(session.user.id);
      } else {
        setUserId(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchNotifications(uid: string) {
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', uid)
      .order('criado_em', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.lida).length);
    }
  }

  async function markAsRead(id: string) {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    if (!userId) return;
    await supabase.from('notificacoes').update({ lida: true }).eq('usuario_id', userId).eq('lida', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
    setUnreadCount(0);
  }

  if (!userId) return null;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Notificações"
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-gray-700 rounded-xl shadow-card-hover z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-heading text-sm font-semibold text-text-primary dark:text-white">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">
                  Nenhuma notificação
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${
                      !n.lida ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">
                        {n.tipo === 'comentario' ? '💬' : n.tipo === 'reacao' ? '👍' : '📢'}
                      </span>
                      <div className="flex-1 min-w-0">
                        {n.post_id ? (
                          <Link
                            href={`/posts/${n.post_id}`}
                            onClick={() => { markAsRead(n.id); setOpen(false); }}
                            className="text-sm text-text-primary dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                          >
                            {n.mensagem}
                          </Link>
                        ) : (
                          <p className="text-sm text-text-primary dark:text-white line-clamp-2">
                            {n.mensagem}
                          </p>
                        )}
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {formatDate(n.criado_em)}
                        </p>
                      </div>
                      {!n.lida && (
                        <div className="w-2 h-2 rounded-full bg-accent-400 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

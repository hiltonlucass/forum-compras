'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
  duration?: number;
}

const STYLES = {
  success: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-800',
    text: 'text-success-700 dark:text-success-400',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    icon: '✕',
  },
  warning: {
    bg: 'bg-accent-50 dark:bg-accent-900/20',
    border: 'border-accent-200 dark:border-accent-800',
    text: 'text-accent-700 dark:text-accent-400',
    icon: '⚠',
  },
};

export default function Toast({ message, type = 'success', onClose, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const style = STYLES[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-card-hover border ${style.bg} ${style.border} ${style.text}`}>
        <span className="text-base font-bold">{style.icon}</span>
        <span className="text-sm font-medium font-body">{message}</span>
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-sm"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

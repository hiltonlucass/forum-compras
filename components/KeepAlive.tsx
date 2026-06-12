'use client';

import { useEffect } from 'react';

const INTERVAL = 5 * 60 * 1000; // 5 minutos

export default function KeepAlive() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    function ping() {
      fetch('/api/ping').catch(() => {});
    }

    // Ping inicial após 1 minuto
    const timeout = setTimeout(ping, 60_000);
    // Depois a cada 5 minutos
    const interval = setInterval(ping, INTERVAL);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return null;
}

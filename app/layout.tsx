import type { Metadata } from 'next';
import { Sora, DM_Sans } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import AuthSync from '@/components/AuthSync';
import { Suspense } from 'react';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fórum de Compras | OutSystems',
  description:
    'Plataforma de documentação e troca de conhecimento para desenvolvedores do módulo de Compras.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${sora.variable} ${dmSans.variable} font-body`}>
        <AuthSync />
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 w-full">
            <Suspense>
              <Sidebar />
            </Suspense>
            <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
              <Suspense>
                {children}
              </Suspense>
            </main>
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

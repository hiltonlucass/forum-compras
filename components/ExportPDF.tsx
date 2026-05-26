'use client';

import { useState } from 'react';

interface ExportPDFProps {
  postId: string;
  title: string;
}

export default function ExportPDF({ postId, title }: ExportPDFProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);

    try {
      // Usar a API route para gerar o PDF
      const response = await fetch(`/api/export-pdf?id=${postId}`);

      if (!response.ok) throw new Error('Erro ao gerar PDF');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
      title="Exportar como PDF"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {loading ? 'Gerando...' : 'PDF'}
    </button>
  );
}

/**
 * Formata uma data ISO para exibição amigável em pt-BR.
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Gera um excerpt a partir de conteúdo HTML.
 */
export function generateExcerpt(html: string, maxLength = 150): string {
  const text = html.replace(/<[^>]+>/g, '');
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Gera um slug a partir de um título.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
  showAction?: boolean;
}

export default function EmptyState({
  title = 'Nenhum post ainda',
  description = 'Seja o primeiro a compartilhar conhecimento com o time.',
  showAction = true,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      {/* Illustration */}
      <div className="mx-auto w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      </div>

      <h2 className="font-heading text-lg font-semibold text-text-primary dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
        {description}
      </p>

      {showAction && (
        <Link
          href="/posts/novo"
          className="inline-flex items-center gap-2 bg-accent-400 hover:bg-accent-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Criar primeiro post
        </Link>
      )}
    </div>
  );
}

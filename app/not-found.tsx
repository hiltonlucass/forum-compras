import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Página não encontrada
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        O conteúdo que você procura não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-primary-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
      >
        ← Voltar para o início
      </Link>
    </div>
  );
}

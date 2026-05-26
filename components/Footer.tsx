export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a2332] py-4 px-6">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>Fórum de Compras v1.0 • OutSystems</span>
        <a
          href="mailto:suporte@empresa.com?subject=Bug no Fórum de Compras"
          className="hover:text-accent-400 transition-colors"
        >
          🐛 Reportar bug
        </a>
      </div>
    </footer>
  );
}

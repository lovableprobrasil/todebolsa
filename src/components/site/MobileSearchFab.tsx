import { Link, useRouterState } from "@tanstack/react-router";
import { Search } from "lucide-react";

/**
 * Botão flutuante "Buscar bolsa" visível apenas no mobile e em rotas públicas.
 * Esconde-se em /bolsas (já tem busca dedicada) e em rotas autenticadas/admin.
 */
export function MobileSearchFab() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const hide =
    pathname.startsWith("/bolsas") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/painel") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/reservas") ||
    pathname.startsWith("/favoritos") ||
    pathname.startsWith("/instituicao") ||
    pathname.startsWith("/carteira") ||
    pathname.startsWith("/meus-dados") ||
    pathname.startsWith("/notificacoes") ||
    pathname.startsWith("/indicacoes");

  if (hide) return null;

  return (
    <Link
      to="/bolsas"
      className="md:hidden fixed left-1/2 -translate-x-1/2 z-40 bottom-[max(1rem,env(safe-area-inset-bottom))] inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground font-semibold shadow-[var(--shadow-elegant)] active:scale-95 transition-transform"
      aria-label="Buscar bolsa"
    >
      <Search className="h-4 w-4" />
      Buscar bolsa
    </Link>
  );
}

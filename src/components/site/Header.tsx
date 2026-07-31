import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LayoutDashboard, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/site/NotificationsBell";

const NAV: { to: string; label: string; search?: Record<string, string> }[] = [
  { to: "/bolsas", label: "Faculdades", search: { level: "GRADUACAO" } },
  { to: "/bolsas", label: "Cursos" },
  { to: "/guia", label: "Profissões" },
  { to: "/blog", label: "Revista" },
  { to: "/faq", label: "Ajuda" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user, profile, isPlatformAdmin } = useAuth();
  const homeTo = isPlatformAdmin ? "/admin" : "/painel";
  const homeLabel = isPlatformAdmin ? "Painel master" : "Meu painel";
  const initials = (profile?.name ?? user?.email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/bolsas", search: q.trim() ? { q: q.trim() } : {} });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-0.5 group" aria-label="Tô de Bolsa — página inicial">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary mr-1.5 group-hover:scale-110 transition-transform" />
          <span className="font-display text-[22px] font-extrabold tracking-tight text-brand-blue leading-none">
            Tôde<span className="text-primary">Bolsa</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              className="text-[15px] font-semibold text-primary hover:text-brand-blue transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={submit}
          className="hidden md:flex lg:hidden flex-1 items-center gap-2 rounded-full bg-secondary border border-border px-4 h-10 focus-within:border-primary focus-within:bg-card transition-colors"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar curso ou cidade..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
          <Link
            to={user ? "/favoritos" : "/auth"}
            search={user ? undefined : { tab: "login" }}
            aria-label="Bolsas favoritas"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-blue hover:bg-secondary transition-colors"
          >
            <Heart className="h-5 w-5" />
          </Link>
          {user ? (
            <>
              <NotificationsBell />
              <Button size="sm" asChild className="gap-2 rounded-lg h-10 px-4">
                <Link to={homeTo}>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px] font-bold">
                    {initials}
                  </span>
                  <span>{homeLabel}</span>
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              asChild
              className="h-10 rounded-lg border-primary/40 px-6 text-[15px] font-semibold text-primary hover:bg-primary-soft hover:text-primary"
            >
              <Link to="/auth" search={{ tab: "login" }}>Entrar</Link>
            </Button>
          )}
        </div>

        <button
          className="md:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted ml-auto"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 flex flex-col gap-1">
            <form onSubmit={submit} className="flex items-center gap-2 rounded-full bg-secondary border border-border px-4 h-10 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar curso ou cidade..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
            </form>
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={item.search}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {user ? (
                <Button className="col-span-2" asChild>
                  <Link to={homeTo} onClick={() => setOpen(false)}>{homeLabel}</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/auth" search={{ tab: "login" }} onClick={() => setOpen(false)}>Entrar</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth" search={{ tab: "signup" }} onClick={() => setOpen(false)}>Criar conta</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

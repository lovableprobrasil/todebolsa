import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LayoutDashboard, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/site/NotificationsBell";

const NAV = [
  { to: "/bolsas", label: "Bolsas" },
  { to: "/para-instituicoes", label: "Instituições" },
  { to: "/guia", label: "Notícias" },
  { to: "/faq", label: "FAQ" },
] as const;

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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)] group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Tô de <span className="text-primary">Bolsa</span>
          </span>
        </Link>

        <form
          onSubmit={submit}
          className="hidden md:flex flex-1 max-w-xl mx-auto items-center gap-2 rounded-full bg-secondary border border-border px-4 h-10 focus-within:border-primary focus-within:bg-background transition-colors"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar curso ou cidade..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <nav className="hidden lg:flex items-center gap-6 shrink-0">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <NotificationsBell />
              <Button size="sm" asChild className="gap-2">
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
            <>
              <Button variant="ghost" size="sm" asChild className="text-sm font-medium">
                <Link to="/auth" search={{ tab: "login" }}>Entrar</Link>
              </Button>
              <Button size="sm" className="bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90 text-sm font-medium" asChild>
                <Link to="/auth" search={{ tab: "signup" }}>Cadastrar</Link>
              </Button>
            </>
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
        <div className="md:hidden border-t border-border bg-background">
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
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted"
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
                  <Button className="bg-brand-blue text-brand-blue-foreground hover:bg-brand-blue/90" asChild>
                    <Link to="/auth" search={{ tab: "signup" }} onClick={() => setOpen(false)}>Cadastrar</Link>
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

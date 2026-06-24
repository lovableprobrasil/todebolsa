import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display font-bold">Tô de Bolsa</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              O maior marketplace de bolsas de estudo do Brasil. Educação acessível
              para todas as idades.
            </p>
          </div>

          <FooterCol title="Para alunos">
            <FooterLink to="/bolsas">Buscar bolsas</FooterLink>
            <FooterLink to="/faq">Como funciona</FooterLink>
            <FooterLink to="/faq">Carteira UGE</FooterLink>
          </FooterCol>

          <FooterCol title="Para instituições">
            <FooterLink to="/para-instituicoes">Cadastrar instituição</FooterLink>
            <FooterLink to="/para-instituicoes">Como funciona</FooterLink>
            <FooterLink to="/faq">Suporte</FooterLink>
          </FooterCol>

          <FooterCol title="Tô de Bolsa">
            <FooterLink to="/faq">Ajuda</FooterLink>
            <FooterLink to="/">Termos de uso</FooterLink>
            <FooterLink to="/">Política de privacidade</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Tô de Bolsa — Todos os direitos reservados.</span>
          <span>Carteira estudantil digital emitida pela UGE — União Geral dos Estudantes do Brasil.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-muted-foreground hover:text-foreground transition-colors">
        {children}
      </Link>
    </li>
  );
}

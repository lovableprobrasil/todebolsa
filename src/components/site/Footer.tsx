import { Link } from "@tanstack/react-router";
import { GraduationCap, HelpCircle, Instagram, Facebook, Youtube, Linkedin, ShieldCheck, Newspaper, BadgeCheck } from "lucide-react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function TrustStrip() {
  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <TrustCol icon={BadgeCheck} title="Qualidade de atendimento">
          Instituições verificadas e ofertas auditadas antes da publicação.
        </TrustCol>
        <TrustCol icon={ShieldCheck} title="Política de reembolso">
          Arrependeu-se? Confira nossas regras de cancelamento e estorno.
        </TrustCol>
        <TrustCol icon={Newspaper} title="Carteira estudantil UGE">
          Carteira digital emitida pela União Geral dos Estudantes do Brasil.
        </TrustCol>
      </div>
    </section>
  );
}

function TrustCol({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-sm font-semibold text-brand-ink">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

export function HelpBanner() {
  return (
    <Link
      to="/faq"
      className="block bg-primary text-primary-foreground transition-colors hover:bg-brand-blue"
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-3 px-4 py-4 text-center text-[15px] font-medium">
        <HelpCircle className="h-5 w-5 shrink-0" />
        <span>
          Tire dúvidas na <strong className="font-bold">Central de ajuda</strong>
        </span>
      </div>
    </Link>
  );
}

export function AlphabetSearch() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-brand-ink">
          Pesquise pela letra inicial
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-2">
          {LETTERS.map((l, i) => (
            <span key={l} className="flex items-center">
              <Link
                to="/bolsas"
                search={{ q: l }}
                className="px-2.5 text-[15px] font-semibold text-primary hover:underline"
              >
                {l}
              </Link>
              {i < LETTERS.length - 1 && <span className="text-border">|</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-card">
      <HelpBanner />
      <AlphabetSearch />

      <div className="border-t border-border">
        <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <FooterCol title="Descubra sua bolsa">
              <FooterLink to="/bolsas">Buscar bolsas</FooterLink>
              <FooterLink to="/bolsas" search={{ level: "GRADUACAO" }}>Bolsas de graduação</FooterLink>
              <FooterLink to="/bolsas" search={{ level: "POS_GRADUACAO" }}>Bolsas de pós-graduação</FooterLink>
              <FooterLink to="/bolsas" search={{ level: "TECNICO" }}>Bolsas de curso técnico</FooterLink>
              <FooterLink to="/bolsas" search={{ level: "IDIOMAS" }}>Bolsas de idiomas</FooterLink>
            </FooterCol>

            <FooterCol title="Conheça os cursos">
              <FooterLink to="/bolsas" search={{ modality: "EAD" }}>Cursos EaD</FooterLink>
              <FooterLink to="/bolsas" search={{ modality: "PRESENCIAL" }}>Cursos presenciais</FooterLink>
              <FooterLink to="/bolsas" search={{ level: "ESCOLAS" }}>Escolas</FooterLink>
              <FooterLink to="/bolsas" search={{ level: "PROFISSIONALIZANTE" }}>Profissionalizantes</FooterLink>
              <FooterLink to="/bolsas" search={{ level: "EJA" }}>EJA</FooterLink>
            </FooterCol>

            <FooterCol title="Encontre sua instituição">
              <FooterLink to="/bolsas">Lista de instituições</FooterLink>
              <FooterLink to="/bolsas">Instituições na sua cidade</FooterLink>
              <FooterLink to="/para-instituicoes">Seja uma parceira</FooterLink>
              <FooterLink to="/instituicao/cadastrar">Cadastrar instituição</FooterLink>
            </FooterCol>

            <FooterCol title="Leia nossa revista">
              <FooterLink to="/blog">Revista Tô de Bolsa</FooterLink>
              <FooterLink to="/guia">Guia do estudante</FooterLink>
              <FooterLink to="/guia">Profissões e carreiras</FooterLink>
              <FooterLink to="/carteira-uge">Carteira de estudante UGE</FooterLink>
            </FooterCol>

            <FooterCol title="Busque ajuda">
              <FooterLink to="/faq">Sobre o Tô de Bolsa</FooterLink>
              <FooterLink to="/faq">Primeiros passos</FooterLink>
              <FooterLink to="/faq">Reembolso e cancelamento</FooterLink>
              <FooterLink to="/termos">Termos de uso</FooterLink>
              <FooterLink to="/privacidade">Política de privacidade</FooterLink>
              <FooterLink to="/cookies">Política de cookies</FooterLink>
            </FooterCol>
          </div>

          <div className="mt-12 flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-extrabold text-brand-blue">
                Tôde<span className="text-primary">Bolsa</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Instagram className="h-5 w-5" />
              <Facebook className="h-5 w-5" />
              <Youtube className="h-5 w-5" />
              <Linkedin className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:justify-between">
            <span>© {new Date().getFullYear()} Tô de Bolsa — Todos os direitos reservados.</span>
            <span>Carteira estudantil digital emitida pela UGE — União Geral dos Estudantes do Brasil.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 text-[15px] font-bold text-brand-ink">{title}</h4>
      <ul className="space-y-3 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({
  to,
  search,
  children,
}: {
  to: string;
  search?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        search={search}
        className="text-muted-foreground transition-colors hover:text-primary"
      >
        {children}
      </Link>
    </li>
  );
}

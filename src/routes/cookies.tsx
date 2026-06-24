import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const SITE = "https://todebolsa.lovable.app";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies | Tô de Bolsa" },
      { name: "description", content: "Como o Tô de Bolsa usa cookies para operar a plataforma e melhorar sua experiência." },
    ],
    links: [{ rel: "canonical", href: `${SITE}/cookies` }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 prose prose-neutral">
        <h1 className="font-display text-4xl font-extrabold">Política de Cookies</h1>
        <p className="text-muted-foreground">Última atualização: 24/06/2026.</p>

        <h2>O que são cookies</h2>
        <p>Cookies são pequenos arquivos de texto armazenados no seu navegador. Eles permitem que o site lembre suas preferências, mantenha você autenticado e meça o desempenho das páginas.</p>

        <h2>Quais cookies usamos</h2>
        <ul>
          <li><strong>Essenciais</strong> — autenticação, sessão, segurança e preferências de consentimento. Não podem ser desativados.</li>
          <li><strong>Analíticos</strong> — métricas anônimas de uso (páginas mais visitadas, tempo médio, origem do tráfego) para melhorarmos a plataforma.</li>
          <li><strong>Funcionais</strong> — lembrar filtros de busca e cidade selecionada.</li>
        </ul>

        <h2>Como gerenciar</h2>
        <p>Na primeira visita você escolhe entre <em>aceitar todos</em> ou <em>apenas essenciais</em>. Você pode revisar sua escolha limpando os dados do site no navegador — o banner aparecerá novamente. A qualquer momento você pode também:</p>
        <ul>
          <li>Bloquear cookies nas configurações do seu navegador.</li>
          <li>Solicitar a exclusão dos seus dados em <Link to="/meus-dados">Privacidade e dados</Link>.</li>
        </ul>

        <h2>Cookies de terceiros</h2>
        <p>Utilizamos provedores autorizados para autenticação e medição. Eles operam sob contratos de proteção de dados (DPA) e seguem a LGPD.</p>

        <h2>Mais informações</h2>
        <p>Consulte também nossa <Link to="/privacidade">Política de Privacidade</Link> e nossos <Link to="/termos">Termos de Uso</Link>.</p>
      </main>
      <Footer />
    </div>
  );
}

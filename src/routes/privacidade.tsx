import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const SITE = "https://todebolsa.lovable.app";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Tô de Bolsa" },
      { name: "description", content: "Como o Tô de Bolsa coleta, usa e protege seus dados em conformidade com a LGPD." },
    ],
    links: [{ rel: "canonical", href: `${SITE}/privacidade` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 prose prose-neutral">
        <h1 className="font-display text-4xl font-extrabold">Política de Privacidade</h1>
        <p className="text-muted-foreground">Última atualização: 24/06/2026 · Conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

        <h2>1. Quais dados coletamos</h2>
        <ul>
          <li><strong>Cadastro:</strong> nome, e-mail, CPF, telefone e data de nascimento.</li>
          <li><strong>Uso:</strong> bolsas visualizadas, favoritadas e reservadas, além de pageviews anônimos.</li>
          <li><strong>Documentos de matrícula:</strong> arquivos enviados para a instituição (acesso restrito).</li>
        </ul>

        <h2>2. Como usamos</h2>
        <p>Para operar a plataforma, gerar sua reserva, processar pagamentos da taxa de adesão, intermediar a matrícula com a instituição e melhorar a experiência.</p>

        <h2>3. Compartilhamento</h2>
        <p>Compartilhamos dados estritamente necessários com instituições parceiras (apenas após sua reserva) e processadores de pagamento autorizados.</p>

        <h2>4. Seus direitos (LGPD)</h2>
        <ul>
          <li>Acessar e exportar seus dados em formato legível.</li>
          <li>Corrigir informações incorretas no seu <Link to="/perfil">perfil</Link>.</li>
          <li>Solicitar a exclusão da sua conta (com prazo de 30 dias para reversão).</li>
          <li>Revogar consentimentos a qualquer momento.</li>
        </ul>
        <p>Gerencie essas opções na página <Link to="/meus-dados">Privacidade e dados</Link>.</p>

        <h2>5. Segurança</h2>
        <p>Aplicamos criptografia em trânsito (HTTPS), políticas de acesso por linha (RLS) e auditoria de todas as operações sensíveis.</p>

        <h2>6. Cookies</h2>
        <p>Usamos cookies essenciais e analíticos. Você pode aceitar todos, apenas essenciais ou revisar a qualquer momento via banner.</p>

        <h2>7. Contato do Encarregado (DPO)</h2>
        <p>privacidade@todebolsa.com.br</p>
      </main>
      <Footer />
    </div>
  );
}

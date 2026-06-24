import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const SITE = "https://todebolsa.lovable.app";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso | Tô de Bolsa" },
      { name: "description", content: "Termos e condições de uso da plataforma Tô de Bolsa para alunos e instituições parceiras." },
    ],
    links: [{ rel: "canonical", href: `${SITE}/termos` }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 prose prose-neutral">
        <h1 className="font-display text-4xl font-extrabold">Termos de Uso</h1>
        <p className="text-muted-foreground">Última atualização: 24/06/2026.</p>

        <h2>1. Quem somos</h2>
        <p>O <strong>Tô de Bolsa</strong> é um marketplace que conecta estudantes a bolsas de estudo oferecidas por instituições de ensino parceiras. Não somos uma instituição de ensino e não emitimos diplomas, certificados ou históricos escolares.</p>

        <h2>2. Aceite</h2>
        <p>Ao criar uma conta, navegar ou utilizar nossos serviços, você declara ter lido, compreendido e concordado integralmente com estes Termos e com nossa <Link to="/privacidade">Política de Privacidade</Link>.</p>

        <h2>3. Cadastro do aluno</h2>
        <ul>
          <li>Você deve fornecer informações verdadeiras, completas e atualizadas.</li>
          <li>O cadastro é pessoal e intransferível.</li>
          <li>Menores de 18 anos devem ter autorização dos responsáveis legais.</li>
        </ul>

        <h2>4. Reserva e taxa de adesão</h2>
        <p>A reserva de uma bolsa garante a vaga junto à instituição por um prazo determinado, mediante o pagamento de uma <strong>taxa de adesão</strong> ao Tô de Bolsa. Essa taxa não substitui mensalidades, matrícula ou demais valores cobrados pela instituição.</p>

        <h2>5. Política de reembolso</h2>
        <ul>
          <li>Você pode solicitar reembolso da taxa de adesão em até <strong>7 dias corridos</strong> após o pagamento, conforme o Código de Defesa do Consumidor.</li>
          <li>Reembolsos por falha de efetivação de matrícula pela instituição são processados em até 30 dias úteis.</li>
        </ul>

        <h2>6. Responsabilidade das instituições</h2>
        <p>Cada instituição é a única responsável pela veracidade das informações de cursos, valores, descontos, infraestrutura, qualidade de ensino e processo de matrícula. O Tô de Bolsa apenas intermedia a oferta.</p>

        <h2>7. Conduta do usuário</h2>
        <p>É proibido publicar conteúdo ofensivo, difamatório, falso, fraudulento ou que viole direitos de terceiros. Avaliações abusivas serão removidas e contas reincidentes serão suspensas.</p>

        <h2>8. Propriedade intelectual</h2>
        <p>Marca, logotipo, layout, código-fonte e demais elementos do Tô de Bolsa são protegidos por direitos autorais. É vedada qualquer reprodução sem autorização expressa.</p>

        <h2>9. Limitação de responsabilidade</h2>
        <p>O Tô de Bolsa não se responsabiliza por decisões acadêmicas, qualidade do ensino, mudanças unilaterais de oferta pela instituição ou prejuízos indiretos decorrentes do uso da plataforma.</p>

        <h2>10. Encerramento</h2>
        <p>Você pode solicitar a exclusão da sua conta na página <Link to="/meus-dados">Privacidade e dados</Link>. Podemos suspender contas que violem estes Termos.</p>

        <h2>11. Alterações</h2>
        <p>Estes Termos podem ser atualizados periodicamente. Mudanças relevantes serão comunicadas com 30 dias de antecedência.</p>

        <h2>12. Foro</h2>
        <p>Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

        <h2>13. Contato</h2>
        <p>contato@todebolsa.com.br</p>
      </main>
      <Footer />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { listFaqs } from "@/lib/scholarships";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes | Tô de Bolsa" },
      { name: "description", content: "Tire suas dúvidas sobre como usar o Tô de Bolsa, bolsas de estudo, reservas e carteira UGE." },
      { property: "og:title", content: "Perguntas frequentes | Tô de Bolsa" },
      { property: "og:description", content: "Como funcionam bolsas, reservas, matrículas e a carteira UGE." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { data } = useQuery({ queryKey: ["faqs"], queryFn: listFaqs });
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display text-4xl font-extrabold mb-2">Perguntas frequentes</h1>
        <p className="text-muted-foreground mb-8">
          Tudo o que você precisa saber para usar o Tô de Bolsa.
        </p>
        <Accordion type="single" collapsible className="w-full">
          {(data ?? []).map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger className="text-left font-semibold">{f.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}

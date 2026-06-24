import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Clock, Users, GraduationCap, CheckCircle2, ArrowLeft, Calendar, Heart, Loader2,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { DiscountBadge } from "@/components/site/DiscountBadge";
import { UgeBadge } from "@/components/site/UgeBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getScholarship } from "@/lib/scholarships";
import {
  COURSE_LEVEL_LABEL, MODALITY_LABEL, SHIFT_LABEL, formatBRL, discountPercent,
} from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/bolsas/$id")({
  loader: async ({ params }) => {
    try {
      const s = await getScholarship(params.id);
      return { scholarship: s };
    } catch {
      return { scholarship: null };
    }
  },
  head: ({ params, loaderData }) => {
    const s = loaderData?.scholarship;
    const url = `https://todebolsa.lovable.app/bolsas/${params.id}`;
    if (!s) {
      return {
        meta: [
          { title: "Detalhes da bolsa | Tô de Bolsa" },
          { name: "description", content: "Veja todos os detalhes da bolsa e garanta sua vaga." },
          { property: "og:url", content: url },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const course = s.course_offering.course;
    const inst = course.institution;
    const original = Number(course.original_price);
    const final = Number(s.price_with_scholarship);
    const discount = original > 0 ? Math.round(((original - final) / original) * 100) : 0;
    const title = `${course.name} com ${discount}% de bolsa — ${inst.trade_name} | Tô de Bolsa`;
    const desc = `${s.title}. Mensalidade com bolsa: R$ ${final.toFixed(2).replace(".", ",")}. Garanta sua vaga no Tô de Bolsa.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.name,
            description: course.description ?? s.title,
            provider: { "@type": "Organization", name: inst.trade_name },
            offers: {
              "@type": "Offer",
              price: final,
              priceCurrency: "BRL",
              url,
              availability: "https://schema.org/InStock",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://todebolsa.lovable.app/" },
              { "@type": "ListItem", position: 2, name: "Bolsas", item: "https://todebolsa.lovable.app/bolsas" },
              { "@type": "ListItem", position: 3, name: inst.trade_name, item: `https://todebolsa.lovable.app/instituicoes/${inst.slug}` },
              { "@type": "ListItem", position: 4, name: course.name, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Bolsa não encontrada</h1>
          <p className="text-muted-foreground mt-2">Esta bolsa pode ter expirado ou sido removida.</p>
          <Button asChild className="mt-6"><Link to="/bolsas">Ver outras bolsas</Link></Button>
        </div>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-destructive">{error.message}</p>
    </div>
  ),
  component: ScholarshipDetail,
});

function ScholarshipDetail() {
  const { id } = Route.useParams();
  const { data: s, isLoading, error } = useQuery({
    queryKey: ["scholarship", id],
    queryFn: async () => {
      const r = await getScholarship(id);
      if (!r) throw notFound();
      return r;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 mx-auto max-w-6xl px-4 py-12 w-full">
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-4" />
          <div className="h-96 rounded-3xl bg-muted animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }
  if (error || !s) return null;

  const course = s.course_offering.course;
  const unit = s.course_offering.institution_unit;
  const inst = course.institution;
  const original = Number(course.original_price);
  const final = Number(s.price_with_scholarship);
  const discount = discountPercent(original, final);
  const savingMonth = original - final;
  const savingYear = savingMonth * 12;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="bg-gradient-to-b from-primary-soft/40 to-background border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <Link
              to="/bolsas"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar às bolsas
            </Link>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-blue-soft text-brand-blue">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <Link
                    to="/instituicoes/$slug"
                    params={{ slug: inst.slug }}
                    className="font-medium hover:text-foreground"
                  >
                    {inst.trade_name}
                  </Link>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
                  {course.name}
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">{s.title}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">{COURSE_LEVEL_LABEL[course.level] ?? course.level}</Badge>
                  <Badge variant="secondary">{MODALITY_LABEL[course.modality] ?? course.modality}</Badge>
                  <Badge variant="secondary">{SHIFT_LABEL[course.shift] ?? course.shift}</Badge>
                </div>
              </div>
              <DiscountBadge percent={discount} size="lg" />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <Section title="Sobre o curso">
              <p className="text-muted-foreground leading-relaxed">
                {course.description ?? "Curso oferecido com bolsa de estudo exclusiva via Tô de Bolsa."}
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <InfoRow icon={MapPin} label="Unidade" value={`${unit.name} · ${unit.city}/${unit.state}`} />
                {course.duration_months && (
                  <InfoRow icon={Clock} label="Duração" value={`${course.duration_months} meses`} />
                )}
                <InfoRow icon={Users} label="Vagas disponíveis" value={`${s.course_offering.vacancies_available}`} />
                <InfoRow icon={Calendar} label="Validade" value="Oferta por tempo limitado" />
              </div>
            </Section>

            <Section title="Regras da bolsa">
              <p className="text-muted-foreground leading-relaxed">
                {s.rules ?? "Bolsa válida para o curso indicado. Manutenção sujeita às regras da instituição."}
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Aplicável à mensalidade do curso",
                  "Renovação conforme regras da instituição",
                  "Vagas limitadas",
                  "Sujeito à confirmação de matrícula",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Benefícios inclusos">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-brand-blue/30 bg-brand-blue-soft/50 p-5">
                  <UgeBadge variant="solid" />
                  <p className="mt-3 text-sm text-foreground/80">
                    Após sua matrícula ser confirmada pela instituição, você fica elegível para receber
                    a carteira de estudante digital emitida pela <strong>UGE — União Geral dos
                    Estudantes do Brasil</strong>, com direito a meia-entrada em cinemas, shows,
                    teatros e eventos esportivos em todo o país.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-accent/40 p-5">
                  <div className="font-bold mb-2">Economia garantida</div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Com esta bolsa você economiza:
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Por mês</span>
                      <span className="font-bold text-success">{formatBRL(savingMonth)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Por ano</span>
                      <span className="font-bold text-success">{formatBRL(savingYear)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] p-6">
              <div className="text-xs text-muted-foreground line-through">
                Mensalidade cheia {formatBRL(original)}
              </div>
              <div className="font-display text-4xl font-extrabold text-primary leading-none mt-1">
                {formatBRL(final)}
                <span className="text-base font-medium text-foreground/70">/mês</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-success">
                Economia de {formatBRL(savingYear)}/ano
              </div>

              <div className="mt-6 space-y-3">
                <ReserveButton scholarshipId={s.id} courseOfferingId={s.course_offering.id} institutionId={inst.id} price={final} />
                <FavoriteButton scholarshipId={s.id} />
              </div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Você precisará criar uma conta para concluir a reserva.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <div className="text-sm font-bold mb-2">Vagas restantes</div>
              <div className="font-display text-2xl font-extrabold">
                {s.course_offering.vacancies_available}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Vagas atualizadas em tempo real
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <h2 className="font-display text-xl md:text-2xl font-extrabold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/60 px-4 py-3">
      <Icon className="h-4 w-4 mt-0.5 text-primary" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function ReserveButton({
  scholarshipId,
}: { scholarshipId: string; courseOfferingId: string; institutionId: string; price: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { data, error } = await supabase.rpc("create_reservation", { p_scholarship_id: scholarshipId });
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["scholarship", scholarshipId] });
      toast.success("Bolsa reservada! Conclua o pagamento para garantir sua vaga.");
      navigate({ to: "/reservas/$id", params: { id: res.id } });
    },
    onError: (e: Error) => {
      if (e.message === "auth") {
        navigate({ to: "/auth", search: { redirect: window.location.pathname } });
        return;
      }
      toast.error(e.message || "Não foi possível reservar agora.");
    },
  });

  return (
    <Button
      size="lg"
      className="w-full font-semibold"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Garantir bolsa agora"}
    </Button>
  );
}

function FavoriteButton({ scholarshipId }: { scholarshipId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: isFav } = useQuery({
    enabled: !!user,
    queryKey: ["fav", scholarshipId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("scholarship_id")
        .eq("user_id", user!.id)
        .eq("scholarship_id", scholarshipId)
        .maybeSingle();
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("scholarship_id", scholarshipId);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, scholarship_id: scholarshipId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fav", scholarshipId] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(isFav ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: (e: Error) => {
      if (e.message === "auth") navigate({ to: "/auth", search: { redirect: window.location.pathname } });
    },
  });

  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
    >
      <Heart className={`h-4 w-4 mr-2 ${isFav ? "fill-primary text-primary" : ""}`} />
      {isFav ? "Favoritado" : "Salvar nos favoritos"}
    </Button>
  );
}

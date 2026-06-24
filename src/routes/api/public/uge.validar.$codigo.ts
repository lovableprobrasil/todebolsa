import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const ELIGIBLE = [
  "CONFIRMED",
  "UNDER_REVIEW",
  "AWAITING_ENROLLMENT",
  "ENROLLMENT_APPROVED",
];

export const Route = createFileRoute("/api/public/uge/validar/$codigo")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const codigo = String(params.codigo || "").trim().toUpperCase();
        if (!codigo || codigo.length < 6) {
          return Response.json(
            { valid: false, reason: "Código inválido" },
            { status: 400 },
          );
        }

        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            auth: {
              storage: undefined,
              persistSession: false,
              autoRefreshToken: false,
            },
          },
        );

        const { data, error } = await supabase
          .from("reservations")
          .select(
            `reservation_code, status, created_at,
             scholarship:scholarships(
               course_offering:course_offerings(
                 course:courses(name, level, institution:institutions(trade_name, city, state))
               )
             ),
             profile:profiles!reservations_user_id_fkey(name)`,
          )
          .eq("reservation_code", codigo)
          .maybeSingle();

        if (error || !data) {
          return Response.json(
            { valid: false, reason: "Carteira não encontrada" },
            { status: 404, headers: { "cache-control": "no-store" } },
          );
        }

        const eligible = ELIGIBLE.includes(String(data.status));
        if (!eligible) {
          return Response.json(
            { valid: false, reason: "Carteira inativa", status: data.status },
            { status: 200, headers: { "cache-control": "no-store" } },
          );
        }

        const issued = new Date(data.created_at);
        const validUntil = new Date(issued);
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        const expired = validUntil.getTime() < Date.now();
        if (expired) {
          return Response.json(
            { valid: false, reason: "Carteira expirada", valid_until: validUntil.toISOString() },
            { status: 200, headers: { "cache-control": "no-store" } },
          );
        }

        const course = (data as any).scholarship?.course_offering?.course;
        const inst = course?.institution;
        const profile = (data as any).profile;

        return Response.json(
          {
            valid: true,
            codigo,
            nome: profile?.name ?? "Estudante Tô de Bolsa",
            instituicao: inst?.trade_name ?? null,
            curso: course?.name ?? null,
            nivel: course?.level ?? null,
            cidade: inst ? [inst.city, inst.state].filter(Boolean).join(" / ") : null,
            emitida_em: issued.toISOString(),
            valido_ate: validUntil.toISOString(),
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});

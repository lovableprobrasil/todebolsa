import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AppRole =
  | "STUDENT"
  | "GUARDIAN"
  | "INSTITUTION_USER"
  | "INSTITUTION_ADMIN"
  | "INSTITUTION_APPLICANT"
  | "PLATFORM_SALES"
  | "PLATFORM_ADMIN";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "PLATFORM_ADMIN",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string; limit?: number; offset?: number }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const search = (data.search ?? "").trim().toLowerCase();
    const perPage = 200;
    const wanted = data.limit ?? 100;
    const skip = data.offset ?? 0;
    const matches: any[] = [];
    let page = 1;
    while (matches.length < skip + wanted && page <= 25) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      for (const u of list.users) {
        const email = (u.email ?? "").toLowerCase();
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        const name = (meta.full_name as string) ?? (meta.name as string) ?? null;
        if (!search || email.includes(search) || (name && name.toLowerCase().includes(search))) {
          matches.push({ id: u.id, email: u.email, name, created_at: u.created_at, banned_until: (u as any).banned_until ?? null });
        }
      }
      if (list.users.length < perPage) break;
      page++;
    }
    const slice = matches.slice(skip, skip + wanted);
    const ids = slice.map((u) => u.id);
    let roles: Record<string, AppRole[]> = {};
    let profiles: Record<string, any> = {};
    if (ids.length) {
      const [{ data: rows, error }, { data: profs, error: pErr }] = await Promise.all([
        supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
        supabaseAdmin.from("profiles").select("id, name, email, phone, cpf, avatar_url").in("id", ids),
      ]);
      if (error) throw new Error(error.message);
      if (pErr) throw new Error(pErr.message);
      for (const r of rows ?? []) (roles[r.user_id] ??= []).push(r.role as AppRole);
      for (const p of profs ?? []) profiles[(p as any).id] = p;
    }
    return slice.map((u) => ({
      ...u,
      profile: profiles[u.id] ?? null,
      roles: roles[u.id] ?? [],
      suspended: !!u.banned_until && new Date(u.banned_until).getTime() > Date.now(),
    }));
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; name?: string; email?: string; phone?: string | null; cpf?: string | null }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updates: Record<string, any> = {};
    const profileUpdates: Record<string, any> = {};
    if (data.name !== undefined) {
      const n = data.name.trim();
      if (n.length < 2) throw new Error("Nome inválido");
      updates.user_metadata = { full_name: n };
      profileUpdates.name = n;
    }
    if (data.email !== undefined) {
      const e = data.email.trim().toLowerCase();
      if (!e.includes("@")) throw new Error("E-mail inválido");
      updates.email = e;
      updates.email_confirm = true;
      profileUpdates.email = e;
    }
    if (data.phone !== undefined) profileUpdates.phone = data.phone?.trim() || null;
    if (data.cpf !== undefined) profileUpdates.cpf = data.cpf?.trim() || null;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, updates as any);
      if (error) throw new Error(error.message);
    }
    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .upsert({ id: data.userId, ...profileUpdates } as any, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; email: string; password: string; role: AppRole }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    if (!email || data.password.length < 6 || data.name.trim().length < 2) {
      throw new Error("Dados inválidos.");
    }
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.name.trim() },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar usuário");
    await supabaseAdmin.from("profiles").upsert(
      { id: created.user.id, name: data.name.trim(), email } as any,
      { onConflict: "id" },
    );
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: created.user.id, role: data.role } as any,
      { onConflict: "user_id,role,institution_id", ignoreDuplicates: true },
    );
    return { id: created.user.id };
  });

export const adminSetUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; suspended: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Você não pode suspender a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.suspended ? "87600h" : "none",
    } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

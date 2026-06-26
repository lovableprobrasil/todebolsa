import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const Schema = z.object({
  session_token: z.string().min(10),
  account: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6).optional(),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  }),
})

export const Route = createFileRoute('/api/public/checkout-finalize')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = Schema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
        }
        const { session_token, account } = parsed.data
        const email = account.email.trim().toLowerCase()

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        // Resolve or create the user
        let userId: string | null = null
        let createdNow = false
        if (account.password) {
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: account.password,
            email_confirm: true,
            user_metadata: { full_name: account.name },
          })
          if (createErr) {
            const msg = (createErr.message || '').toLowerCase()
            if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
              // find existing
              let page = 1
              while (page <= 20 && !userId) {
                const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
                const match = list?.users.find((u) => (u.email || '').toLowerCase() === email)
                if (match) { userId = match.id; break }
                if (!list?.users.length || list.users.length < 200) break
                page++
              }
              if (!userId) return Response.json({ error: 'E-mail já cadastrado. Faça login para continuar.' }, { status: 409 })
            } else {
              return Response.json({ error: createErr.message }, { status: 500 })
            }
          } else {
            userId = created.user?.id ?? null
            createdNow = true
          }
        } else {
          // no password = existing user must be looked up by email
          let page = 1
          while (page <= 20 && !userId) {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
            const match = list?.users.find((u) => (u.email || '').toLowerCase() === email)
            if (match) { userId = match.id; break }
            if (!list?.users.length || list.users.length < 200) break
            page++
          }
          if (!userId) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        if (!userId) return Response.json({ error: 'Falha ao resolver usuário' }, { status: 500 })

        // Sync profile
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          name: account.name,
          email,
          phone: account.phone ? account.phone.replace(/\D/g, '') : null,
          cpf: account.cpf ? account.cpf.replace(/\D/g, '') : null,
        } as any, { onConflict: 'id' })

        // Finalize via RPC
        const { data: reservationId, error: finErr } = await supabaseAdmin
          .rpc('checkout_finalize', { p_session_token: session_token, p_user_id: userId })
        if (finErr) {
          return Response.json({ error: finErr.message }, { status: 500 })
        }

        return Response.json({
          ok: true,
          user_id: userId,
          reservation_id: reservationId,
          created_account: createdNow,
        })
      },
    },
  },
})

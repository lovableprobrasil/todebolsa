import * as React from 'react'
import { render } from 'react-email'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'todebolsa'
const SENDER_DOMAIN = 'notify.todebolsa.com.br'
const FROM_DOMAIN = 'todebolsa.com.br'

const PayloadSchema = z.object({
  account: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  application: z.object({
    trade_name: z.string().nullable().optional(),
    legal_name: z.string().nullable().optional(),
    cnpj: z.string().nullable().optional(),
    institution_type: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    responsible_name: z.string().nullable().optional(),
    responsible_role: z.string().nullable().optional(),
    responsible_cpf: z.string().nullable().optional(),
    responsible_email: z.string().nullable().optional(),
    responsible_whatsapp: z.string().nullable().optional(),
    authorization_declared: z.boolean().optional(),
    zip: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    number: z.string().nullable().optional(),
    complement: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    service_mode: z.string().nullable().optional(),
    courses_offered: z.array(z.string()).optional(),
    levels: z.array(z.string()).optional(),
    modalities: z.array(z.string()).optional(),
    has_idle_vacancies: z.boolean().nullable().optional(),
    avg_discount_pct: z.number().nullable().optional(),
    monthly_vacancies: z.number().nullable().optional(),
    accepted_terms: z.boolean().optional(),
    accepted_privacy: z.boolean().optional(),
    accepted_truthfulness: z.boolean().optional(),
    accepted_representation: z.boolean().optional(),
  }),
})

function genToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const Route = createFileRoute('/api/public/institution-application')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try { body = await request.json() } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = PayloadSchema.safeParse(body)
        if (!parsed.success) {
          return Response.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
        }
        const { account, application } = parsed.data
        const email = account.email.trim().toLowerCase()

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        // 1) Find or create the auth user (pre-confirmed so they can sign in immediately)
        let userId: string | null = null
        let createdNow = false
        try {
          const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: account.password,
            email_confirm: true,
            user_metadata: { name: account.name },
          })
          if (createErr) {
            // If the user already exists, look them up
            const msg = (createErr.message || '').toLowerCase()
            if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
              // Page through admin.listUsers to find by email
              let page = 1
              while (page <= 20 && !userId) {
                const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
                if (listErr) break
                const match = list.users.find((u) => (u.email || '').toLowerCase() === email)
                if (match) { userId = match.id; break }
                if (!list.users.length || list.users.length < 200) break
                page++
              }
              if (!userId) {
                return Response.json({ error: 'E-mail já cadastrado. Faça login para continuar o credenciamento.' }, { status: 409 })
              }
            } else {
              console.error('createUser failed', createErr)
              return Response.json({ error: createErr.message }, { status: 500 })
            }
          } else {
            userId = created.user?.id ?? null
            createdNow = true
          }
        } catch (e: any) {
          console.error('createUser exception', e)
          return Response.json({ error: e?.message || 'Falha ao criar conta' }, { status: 500 })
        }

        if (!userId) return Response.json({ error: 'Não foi possível resolver o usuário' }, { status: 500 })

        // 2) Sync profile (best-effort)
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          name: account.name || application.responsible_name || null,
          email,
          phone: application.responsible_whatsapp ? application.responsible_whatsapp.replace(/\D/g, '') : null,
          cpf: application.responsible_cpf ? application.responsible_cpf.replace(/\D/g, '') : null,
        } as any, { onConflict: 'id' })

        // 3) Create or reuse a DRAFT application for this user, then submit
        const { data: existingDraft } = await supabaseAdmin
          .from('institution_applications')
          .select('id, status')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let appId: string
        if (existingDraft && existingDraft.status === 'DRAFT') {
          appId = existingDraft.id
        } else if (existingDraft && existingDraft.status !== 'DRAFT') {
          return Response.json({
            error: 'Já existe um credenciamento em andamento para esta conta.',
            applicationId: existingDraft.id,
            status: existingDraft.status,
          }, { status: 409 })
        } else {
          const { data: inserted, error: insErr } = await supabaseAdmin
            .from('institution_applications')
            .insert({ user_id: userId, status: 'DRAFT' } as any)
            .select('id')
            .single()
          if (insErr || !inserted) {
            console.error('insert application failed', insErr)
            return Response.json({ error: insErr?.message || 'Falha ao criar aplicação' }, { status: 500 })
          }
          appId = inserted.id
        }

        const now = new Date().toISOString()
        const updatePayload: Record<string, any> = {
          ...application,
          status: 'SUBMITTED',
          submitted_at: now,
          updated_at: now,
        }

        const { error: updErr } = await supabaseAdmin
          .from('institution_applications')
          .update(updatePayload as any)
          .eq('id', appId)
        if (updErr) {
          console.error('update application failed', updErr)
          return Response.json({ error: updErr.message }, { status: 500 })
        }

        // 4) Enqueue confirmation email
        const recipient = (application.responsible_email || application.email || email).trim()
        const messageId = crypto.randomUUID()
        const idempotencyKey = `institution-app-submitted-${appId}`
        const templateName = 'institution-application-submitted'

        try {
          const tpl = TEMPLATES[templateName]
          if (tpl && recipient) {
            // Suppression check
            const { data: suppressed } = await supabaseAdmin
              .from('suppressed_emails')
              .select('id')
              .eq('email', recipient.toLowerCase())
              .maybeSingle()
            if (suppressed) {
              await supabaseAdmin.from('email_send_log').insert({
                message_id: messageId,
                template_name: templateName,
                recipient_email: recipient,
                status: 'suppressed',
              } as any)
            } else {
              // Get or create unsubscribe token
              let unsubToken: string | null = null
              const { data: existingTok } = await supabaseAdmin
                .from('email_unsubscribe_tokens')
                .select('token, used_at')
                .eq('email', recipient.toLowerCase())
                .maybeSingle()
              if (existingTok && !existingTok.used_at) {
                unsubToken = existingTok.token
              } else if (!existingTok) {
                unsubToken = genToken()
                await supabaseAdmin
                  .from('email_unsubscribe_tokens')
                  .upsert({ token: unsubToken, email: recipient.toLowerCase() } as any, { onConflict: 'email', ignoreDuplicates: true })
                const { data: stored } = await supabaseAdmin
                  .from('email_unsubscribe_tokens')
                  .select('token')
                  .eq('email', recipient.toLowerCase())
                  .maybeSingle()
                if (stored) unsubToken = stored.token
              }

              const templateData = {
                responsibleName: application.responsible_name || account.name || 'responsável',
                institutionName: application.trade_name || application.legal_name || 'sua instituição',
                siteUrl: new URL(request.url).origin,
                supportEmail: 'contato@todebolsa.com.br',
              }
              const element = React.createElement(tpl.component, templateData)
              const html = await render(element)
              const text = await render(element, { plainText: true })
              const subject = typeof tpl.subject === 'function' ? tpl.subject(templateData) : tpl.subject

              await supabaseAdmin.from('email_send_log').insert({
                message_id: messageId,
                template_name: templateName,
                recipient_email: recipient,
                status: 'pending',
              } as any)

              const { error: qErr } = await supabaseAdmin.rpc('enqueue_email' as any, {
                queue_name: 'transactional_emails',
                payload: {
                  message_id: messageId,
                  to: recipient,
                  from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                  sender_domain: SENDER_DOMAIN,
                  subject,
                  html,
                  text,
                  purpose: 'transactional',
                  label: templateName,
                  idempotency_key: idempotencyKey,
                  unsubscribe_token: unsubToken,
                  queued_at: new Date().toISOString(),
                },
              } as any)
              if (qErr) {
                console.error('enqueue_email failed', qErr)
                await supabaseAdmin.from('email_send_log').insert({
                  message_id: messageId,
                  template_name: templateName,
                  recipient_email: recipient,
                  status: 'failed',
                  error_message: 'enqueue_email failed: ' + qErr.message,
                } as any)
              }
            }
          }
        } catch (mailErr: any) {
          console.error('email enqueue exception', mailErr)
        }

        return Response.json({
          success: true,
          applicationId: appId,
          userId,
          createdAccount: createdNow,
        })
      },
    },
  },
})

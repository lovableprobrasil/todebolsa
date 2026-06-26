import { supabase } from '@/integrations/supabase/client'

export interface SendTransactionalEmailInput {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, unknown>
}

/**
 * Enqueues a transactional email through the internal /lovable send route.
 * Requires the caller to have a valid Supabase session (handled by the
 * default Supabase client in the browser).
 */
export async function sendTransactionalEmail(input: SendTransactionalEmailInput): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Sessão não encontrada para envio de e-mail.')

  const res = await fetch('/lovable/email/transactional/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    throw new Error(`Falha ao enviar e-mail (${res.status}): ${errorText.slice(0, 300)}`)
  }
}

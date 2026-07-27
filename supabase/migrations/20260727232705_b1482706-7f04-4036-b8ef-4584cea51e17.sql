-- 1) Fixar search_path nas funções da fila de e-mails
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq, extensions;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq, extensions;

-- 2) INSTITUTIONS: remover colunas sensíveis do alcance de usuários autenticados comuns
REVOKE SELECT ON TABLE public.institutions FROM authenticated;
GRANT SELECT (
  id, slug, trade_name, legal_name, description, logo_url, cover_url,
  website, mec_code, rating, status, is_featured, created_at, updated_at,
  rating_avg, rating_count
) ON public.institutions TO authenticated;
REVOKE SELECT (cnpj, email, phone) ON public.institutions FROM anon, authenticated;

-- Função segura para o dono da instituição / admin acessar os dados de contato
CREATE OR REPLACE FUNCTION public.institution_contact_info(p_institution_id uuid)
RETURNS TABLE (id uuid, cnpj text, email text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.cnpj, i.email, i.phone
  FROM public.institutions i
  WHERE i.id = p_institution_id
    AND (
      public.is_platform_admin(auth.uid())
      OR public.is_institution_admin(auth.uid(), i.id)
    );
$$;
REVOKE ALL ON FUNCTION public.institution_contact_info(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.institution_contact_info(uuid) TO authenticated;

-- Listagem administrativa (inclui contato) apenas para administradores da plataforma
CREATE OR REPLACE FUNCTION public.admin_list_institutions()
RETURNS TABLE (
  id uuid, trade_name text, slug text, status institution_status,
  is_featured boolean, email text, phone text, cnpj text, created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.trade_name, i.slug, i.status, i.is_featured,
         i.email, i.phone, i.cnpj, i.created_at
  FROM public.institutions i
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY i.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.admin_list_institutions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_institutions() TO authenticated;

-- Permitir que o responsável atualize apenas colunas de perfil (sem cnpj)
REVOKE UPDATE ON TABLE public.institutions FROM authenticated;
GRANT UPDATE (
  trade_name, legal_name, description, logo_url, cover_url,
  website, email, phone, updated_at
) ON public.institutions TO authenticated;

-- 3) CHECKOUT_ACCEPTANCES: somente o sistema grava (PII de leads)
REVOKE INSERT, UPDATE, DELETE ON public.checkout_acceptances FROM anon, authenticated;
REVOKE SELECT ON public.checkout_acceptances FROM anon;
GRANT ALL ON public.checkout_acceptances TO service_role;

-- 4) EMAIL_SEND_STATE: inacessível a clientes
REVOKE ALL ON public.email_send_state FROM anon, authenticated;
DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
CREATE POLICY "Service role manages email send state"
  ON public.email_send_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON public.email_send_state TO service_role;

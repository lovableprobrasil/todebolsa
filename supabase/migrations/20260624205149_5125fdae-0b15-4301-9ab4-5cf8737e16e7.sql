
-- Revoke EXECUTE from anon on user-facing SECURITY DEFINER RPCs.
-- All of these already check auth.uid()/roles internally; they should never be
-- callable by anonymous visitors.

REVOKE EXECUTE ON FUNCTION public.pay_reservation(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_reservation(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cancel_reservation(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_institution(text, text, text, text, text, text, text, text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.assign_user_role(uuid, app_role, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revoke_user_role(uuid, app_role, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.toggle_institution_feature(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.toggle_scholarship_feature(uuid, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_institution_status(uuid, institution_status) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_refund(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_users(text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.finance_overview() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.finance_revenue_by_institution() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.crm_overview() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_lead_status(uuid, lead_status) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.assign_lead(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.confirm_enrollment(uuid, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.institution_paid_leads_report(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.gen_reservation_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.expire_reservations() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;

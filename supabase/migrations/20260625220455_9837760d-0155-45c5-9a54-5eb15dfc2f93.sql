
REVOKE EXECUTE ON FUNCTION public.publish_scheduled_news() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_news() TO service_role;

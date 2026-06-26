ALTER TABLE public.scholarship_letters
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

DROP POLICY IF EXISTS "user marks own letter email sent" ON public.scholarship_letters;
CREATE POLICY "user marks own letter email sent"
  ON public.scholarship_letters
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
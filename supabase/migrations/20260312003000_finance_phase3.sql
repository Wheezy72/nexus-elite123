-- ==================== FINANCE (Phase 3) ====================

-- Categories (custom names + colors)
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own finance categories" ON public.finance_categories;
CREATE POLICY "Users manage own finance categories"
ON public.finance_categories
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Savings goals
CREATE TABLE IF NOT EXISTS public.finance_savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target NUMERIC(12,2) NOT NULL,
  current NUMERIC(12,2) NOT NULL DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_savings_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own finance savings goals" ON public.finance_savings_goals;
CREATE POLICY "Users manage own finance savings goals"
ON public.finance_savings_goals
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Custom limits + warnings
CREATE TABLE IF NOT EXISTS public.finance_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly')),
  limit NUMERIC(12,2) NOT NULL,
  category TEXT,
  warn_at_percent INTEGER NOT NULL DEFAULT 75 CHECK (warn_at_percent BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period, category)
);

ALTER TABLE public.finance_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own finance limits" ON public.finance_limits;
CREATE POLICY "Users manage own finance limits"
ON public.finance_limits
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_finance_limits_updated_at
BEFORE UPDATE ON public.finance_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


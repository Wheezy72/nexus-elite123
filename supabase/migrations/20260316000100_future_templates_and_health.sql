-- ==================== FUTURE TEMPLATES + HEALTH METRICS ====================

-- Daily aggregates from mobile Health Connect (and later HealthKit)
CREATE TABLE IF NOT EXISTS public.health_daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  active_minutes INTEGER,
  sleep_minutes INTEGER,
  resting_hr INTEGER,
  hrv_ms NUMERIC(10,2),
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.health_daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own health daily metrics" ON public.health_daily_metrics;
CREATE POLICY "Users manage own health daily metrics"
ON public.health_daily_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_health_daily_metrics_updated_at ON public.health_daily_metrics;
CREATE TRIGGER update_health_daily_metrics_updated_at
BEFORE UPDATE ON public.health_daily_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== TASK TEMPLATES ====================
-- Stored per user and synced across devices.
-- `tasks` stores a JSON array of items matching the app task shape:
-- [{text,column,priority,dueDate?,subtasks:[]}, ...]
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own task templates" ON public.task_templates;
CREATE POLICY "Users manage own task templates"
ON public.task_templates
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_task_templates_updated_at ON public.task_templates;
CREATE TRIGGER update_task_templates_updated_at
BEFORE UPDATE ON public.task_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== JOURNAL TEMPLATES ====================
-- Stored per user and synced across devices.
CREATE TABLE IF NOT EXISTS public.journal_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own journal templates" ON public.journal_templates;
CREATE POLICY "Users manage own journal templates"
ON public.journal_templates
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_journal_templates_updated_at ON public.journal_templates;
CREATE TRIGGER update_journal_templates_updated_at
BEFORE UPDATE ON public.journal_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

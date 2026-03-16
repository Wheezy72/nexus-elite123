import { supabase } from '../lib/supabase';
import { readDailyMetrics, type DailyHealthMetrics } from './healthConnect';

export async function syncHealthToSupabase({ days }: { days: number }) {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) throw new Error('Not signed in');

  const metrics = await readDailyMetrics(days);

  const rows = metrics.map(m => {
    const sleepMinutes = typeof m.sleepMinutes === 'number' ? m.sleepMinutes : null;

    return {
      user_id: userId,
      date: m.date,
      steps: m.steps,
      sleep_minutes: sleepMinutes,
      resting_hr: m.avgHeartRate,
      source: 'health_connect',
    };
  });

  const { error } = await supabase
    .from('health_daily_metrics')
    .upsert(rows as any, { onConflict: 'user_id,date' } as any);

  if (error) throw error;

  return metrics;
}

export type { DailyHealthMetrics };

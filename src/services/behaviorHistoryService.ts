import { supabase } from '@/integrations/supabase/client';

export interface BehaviorEntry {
  date: string; // YYYY-MM-DD
  mood?: number; // 1-5
  sleepHours?: number;
  sleepMinutes?: number;
  tasksDone?: number;
  journalCount?: number;
  exerciseDone?: boolean;
  waterGlasses?: number;
  waterGoal?: number;
  spend?: number;
  steps?: number;
  activeMinutes?: number;
  restingHr?: number;
  hrvMs?: number;
}

type Period = 'week' | 'month' | 'quarter' | number;

function toDateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function getDays(period: Period) {
  if (typeof period === 'number') return period;
  if (period === 'week') return 7;
  if (period === 'quarter') return 90;
  return 30;
}

function moodValueFromEntry(label?: string | null, emoji?: string | null) {
  const byEmoji: Record<string, number> = {
    '😄': 5,
    '🙂': 4,
    '😐': 3,
    '😔': 2,
    '😢': 1,
  };

  if (emoji && byEmoji[emoji] != null) return byEmoji[emoji];

  const byLabel: Record<string, number> = {
    Amazing: 5,
    Good: 4,
    Okay: 3,
    Low: 2,
    Rough: 1,
  };

  if (label && byLabel[label] != null) return byLabel[label];
  return null;
}

export const behaviorHistoryService = {
  async getBehaviorHistory(period: Period): Promise<BehaviorEntry[]> {
    const days = getDays(period);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const startISO = new Date(start);
    startISO.setHours(0, 0, 0, 0);

    const dateKeys = Array.from({ length: days }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return toDateKey(d);
    });

    const base: Record<string, BehaviorEntry> = {};
    for (const k of dateKeys) base[k] = { date: k, tasksDone: 0, journalCount: 0, spend: 0 };

    const [moodRes, sleepRes, tasksRes, journalRes, waterRes, habitLogsRes, habitsRes, financeRes, healthRes] = await Promise.all([
      supabase
        .from('mood_entries')
        .select('date,emoji,label')
        .gte('date', startISO.toISOString())
        .lte('date', end.toISOString()),
      supabase
        .from('sleep_entries')
        .select('date,hours_slept')
        .gte('date', toDateKey(startISO))
        .lte('date', toDateKey(end)),
      supabase
        .from('tasks')
        .select('updated_at,column_status')
        .gte('updated_at', startISO.toISOString())
        .lte('updated_at', end.toISOString())
        .eq('column_status', 'done'),
      supabase
        .from('journal_entries')
        .select('created_at')
        .gte('created_at', startISO.toISOString())
        .lte('created_at', end.toISOString()),
      supabase
        .from('water_logs')
        .select('date,glasses,goal')
        .gte('date', toDateKey(startISO))
        .lte('date', toDateKey(end)),
      supabase
        .from('habit_logs')
        .select('date,habit_id')
        .gte('date', toDateKey(startISO))
        .lte('date', toDateKey(end)),
      supabase.from('habits').select('id,name,emoji'),
      // Finance tables may not exist in older deployments; ignore errors.
      supabase
        .from('finance_transactions')
        .select('date,amount')
        .gte('date', toDateKey(startISO))
        .lte('date', toDateKey(end)),
      // Health metrics tables may not exist in older deployments; ignore errors.
      supabase
        .from('health_daily_metrics')
        .select('date,steps,active_minutes,sleep_minutes,resting_hr,hrv_ms')
        .gte('date', toDateKey(startISO))
        .lte('date', toDateKey(end)),
    ]);

    if (!moodRes.error) {
      const byDay: Record<string, number[]> = {};
      for (const m of moodRes.data ?? []) {
        const key = String(m.date).split('T')[0];
        const v = moodValueFromEntry(m.label, m.emoji);
        if (v == null) continue;
        if (!byDay[key]) byDay[key] = [];
        byDay[key].push(v);
      }
      for (const [k, values] of Object.entries(byDay)) {
        if (!base[k]) continue;
        base[k].mood = Math.round((values.reduce((s, x) => s + x, 0) / values.length) * 10) / 10;
      }
    }

    if (!sleepRes.error) {
      for (const s of sleepRes.data ?? []) {
        const key = String(s.date);
        if (!base[key]) continue;
        base[key].sleepHours = Number(s.hours_slept);
      }
    }

    if (!tasksRes.error) {
      for (const t of tasksRes.data ?? []) {
        const key = String(t.updated_at).split('T')[0];
        if (!base[key]) continue;
        base[key].tasksDone = (base[key].tasksDone || 0) + 1;
      }
    }

    if (!journalRes.error) {
      for (const j of journalRes.data ?? []) {
        const key = String(j.created_at).split('T')[0];
        if (!base[key]) continue;
        base[key].journalCount = (base[key].journalCount || 0) + 1;
      }
    }

    if (!waterRes.error) {
      for (const w of waterRes.data ?? []) {
        const key = String(w.date);
        if (!base[key]) continue;
        base[key].waterGlasses = w.glasses;
        base[key].waterGoal = w.goal;
      }
    }

    const habitsById = new Map<string, { name: string; emoji: string }>();
    if (!habitsRes.error) {
      for (const h of habitsRes.data ?? []) {
        habitsById.set(h.id, { name: h.name, emoji: h.emoji });
      }
    }

    if (!habitLogsRes.error) {
      const exerciseByDay: Record<string, boolean> = {};
      for (const l of habitLogsRes.data ?? []) {
        const key = String(l.date);
        if (!base[key]) continue;
        const meta = habitsById.get(l.habit_id);
        if (!meta) continue;
        const isExercise =
          meta.emoji === '🏃' ||
          meta.emoji === '💪' ||
          /exercise|workout|run|gym/i.test(meta.name);
        if (isExercise) exerciseByDay[key] = true;
      }
      for (const [k, v] of Object.entries(exerciseByDay)) {
        if (base[k]) base[k].exerciseDone = v;
      }
    }

    if (!financeRes.error) {
      for (const f of financeRes.data ?? []) {
        const key = String(f.date);
        if (!base[key]) continue;
        base[key].spend = (base[key].spend || 0) + Number(f.amount);
      }
    }

    if (!healthRes.error) {
      for (const h of healthRes.data ?? []) {
        const key = String(h.date);
        if (!base[key]) continue;
        if (typeof h.steps === 'number') base[key].steps = h.steps;
        if (typeof h.active_minutes === 'number') base[key].activeMinutes = h.active_minutes;
        if (typeof h.sleep_minutes === 'number') {
          base[key].sleepMinutes = h.sleep_minutes;
          if (typeof base[key].sleepHours !== 'number') {
            base[key].sleepHours = Math.round((h.sleep_minutes / 60) * 10) / 10;
          }
        }
        if (typeof h.resting_hr === 'number') base[key].restingHr = h.resting_hr;
        if (typeof h.hrv_ms === 'number') base[key].hrvMs = h.hrv_ms;
      }
    }

    return dateKeys.map(k => base[k]);
  },
};

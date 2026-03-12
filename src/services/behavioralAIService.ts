import { supabase } from '@/integrations/supabase/client';

export interface UserAIPreferenceProfile {
  archetype: string;
  peakTime: string;
  strengths: string[];
  challenges: string[];
  updatedAt: string;
}

const CACHE_KEY = 'nexus-ai-user-profile';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function toDateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function getPeriodFromHour(hour: number) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export const behavioralAIService = {
  getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    return getPeriodFromHour(new Date().getHours());
  },

  getCachedProfile(): UserAIPreferenceProfile | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UserAIPreferenceProfile;
      if (!parsed.updatedAt) return null;
      const age = Date.now() - new Date(parsed.updatedAt).getTime();
      if (age > CACHE_TTL_MS) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  async refreshProfile(): Promise<UserAIPreferenceProfile> {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const startISO = new Date(start);
    startISO.setHours(0, 0, 0, 0);

    const [tasksRes, journalRes, moodRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('updated_at,column_status,priority')
        .gte('updated_at', startISO.toISOString())
        .lte('updated_at', end.toISOString()),
      supabase
        .from('journal_entries')
        .select('created_at')
        .gte('created_at', startISO.toISOString())
        .lte('created_at', end.toISOString()),
      supabase
        .from('mood_entries')
        .select('date')
        .gte('date', startISO.toISOString())
        .lte('date', end.toISOString()),
    ]);

    const tasks = tasksRes.error ? [] : tasksRes.data ?? [];
    const journal = journalRes.error ? [] : journalRes.data ?? [];
    const moods = moodRes.error ? [] : moodRes.data ?? [];

    const doneTasks = tasks.filter(t => t.column_status === 'done');

    const completedByHour: Record<number, number> = {};
    for (const t of doneTasks) {
      const hour = new Date(t.updated_at).getHours();
      completedByHour[hour] = (completedByHour[hour] || 0) + 1;
    }

    const peakHour = Object.entries(completedByHour)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const peakTime = peakHour != null ? `${getPeriodFromHour(Number(peakHour))} (around ${peakHour}:00)` : 'varies';

    const activeDays = new Set(doneTasks.map(t => String(t.updated_at).split('T')[0]));
    const journalDays = new Set(journal.map(j => String(j.created_at).split('T')[0]));
    const moodDays = new Set(moods.map(m => String(m.date).split('T')[0]));

    const planningSignals = tasks.filter(t => t.column_status === 'todo' && t.priority === 'high').length;
    const firefightingSignals = doneTasks.filter(t => {
      const d = new Date(t.updated_at);
      const hour = d.getHours();
      return hour >= 22 || hour < 2;
    }).length;
    const reflectionSignals = journal.length;

    let archetype = 'balanced';
    const scores: Record<string, number> = { planner: 0, firefighter: 0, executor: 0, analyzer: 0 };
    if (planningSignals > 10) scores.planner += 2;
    if (firefightingSignals > 5) scores.firefighter += 2;
    if (doneTasks.length > 20) scores.executor += 2;
    if (reflectionSignals > 10) scores.analyzer += 2;

    const max = Math.max(...Object.values(scores));
    const picked = Object.entries(scores).find(([, v]) => v === max && v > 0)?.[0];
    if (picked) archetype = picked;

    const challenges: string[] = [];
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return toDateKey(d);
    });

    const noActivityDays = days.filter(d => !activeDays.has(d) && !journalDays.has(d) && !moodDays.has(d)).length;
    if (noActivityDays > 12) challenges.push('consistency');

    const lateNights = firefightingSignals;
    if (lateNights > 8) challenges.push('late-night productivity');

    const strengths: string[] = [];
    if (doneTasks.length > 40) strengths.push('follow-through');
    if (journalDays.size > 10) strengths.push('reflection');
    if (moodDays.size > 10) strengths.push('self-awareness');

    const profile: UserAIPreferenceProfile = {
      archetype,
      peakTime,
      strengths: strengths.length ? strengths : ['resilience'],
      challenges: challenges.length ? challenges : ['overload'],
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
    return profile;
  },
};

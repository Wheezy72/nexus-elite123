import { behaviorHistoryService, type BehaviorEntry } from '@/services/behaviorHistoryService';
import { behavioralAIService } from '@/services/behavioralAIService';
import { calculateAnalytics, calculateCorrelations } from '@/lib/analytics';
import { aiClientService } from '@/services/aiClientService';

export interface WeeklyReviewAnomaly {
  id: string;
  title: string;
  detail: string;
}

export interface WeeklyReview {
  weekOf: string; // YYYY-MM-DD (Monday)
  analytics: {
    current: ReturnType<typeof calculateAnalytics>;
    previous: ReturnType<typeof calculateAnalytics>;
    delta: {
      wellnessScore: number;
      productivityIndex: number;
      consistencyScore: number;
      emotionalStability: number;
    };
  };
  health: {
    stepsAvg: number | null;
    sleepAvgHours: number | null;
    restingHrAvg: number | null;
  };
  correlations: Array<{ id: string; name: string; strength: number; insight: string }>;
  anomalies: WeeklyReviewAnomaly[];
  nextActions: Array<{ id: string; title: string; minutes: number; route: string }>;
  ai?: {
    bullets: string[];
    nextStep: { title: string; minutes: number; route?: string } | null;
    why?: string[];
    provider?: string;
  };
}

function toDateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function mean(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

function stdev(nums: number[]) {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const v = mean(nums.map(x => (x - m) ** 2));
  return Math.sqrt(v);
}

function zScore(value: number, baseline: number[], floor = 0.001) {
  const sd = Math.max(stdev(baseline), floor);
  return (value - mean(baseline)) / sd;
}

function getWeekStartMonday(now = new Date()) {
  const d = new Date(now);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday=0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function splitWeeks(history: BehaviorEntry[]) {
  if (history.length < 14) {
    return {
      current: history.slice(-7),
      previous: history.slice(Math.max(0, history.length - 14), Math.max(0, history.length - 7)),
    };
  }
  return {
    current: history.slice(-7),
    previous: history.slice(-14, -7),
  };
}

function avgOrNull(values: Array<number | null | undefined>) {
  const nums = values.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  if (!nums.length) return null;
  return Math.round(mean(nums) * 10) / 10;
}

function pickTopCorrelations(history: BehaviorEntry[]) {
  return calculateCorrelations(history).slice(0, 2);
}

function buildNextActions(currentWeek: BehaviorEntry[], spendTotal: number) {
  const actions: WeeklyReview['nextActions'] = [];

  const sleepAvg = avgOrNull(currentWeek.map(d => d.sleepHours));
  const moodAvg = avgOrNull(currentWeek.map(d => d.mood));
  const tasksAvg = avgOrNull(currentWeek.map(d => d.tasksDone));

  if (sleepAvg != null && sleepAvg < 6.8) {
    actions.push({ id: 'sleep-reset', title: 'Sleep reset (tonight)', minutes: 15, route: '/sleep' });
  }

  if (tasksAvg != null && tasksAvg < 2) {
    actions.push({ id: 'daily-reset', title: 'Daily reset: 1 must-do + 2 tiny wins', minutes: 10, route: '/tasks' });
  }

  if (moodAvg != null && moodAvg < 3) {
    actions.push({ id: 'mood-checkin', title: 'Mood check-in + trigger note', minutes: 3, route: '/mood' });
  }

  if (spendTotal > 0) {
    actions.push({ id: 'money-scan', title: 'Money scan: categorize + set one limit', minutes: 8, route: '/finance' });
  }

  actions.push({ id: 'journal', title: '2-minute brain dump', minutes: 2, route: '/journal' });

  return actions.slice(0, 4);
}

function buildAnomalies(history30: BehaviorEntry[], currentWeek: BehaviorEntry[]) {
  const anomalies: WeeklyReviewAnomaly[] = [];

  const baseline = history30.slice(0, Math.max(0, history30.length - 7));

  const currentSleepAvg = avgOrNull(currentWeek.map(d => d.sleepHours));
  const baselineSleep = baseline.map(d => d.sleepHours).filter((x): x is number => typeof x === 'number');
  if (currentSleepAvg != null && baselineSleep.length >= 10) {
    const z = zScore(currentSleepAvg, baselineSleep);
    if (z <= -1.3) {
      anomalies.push({
        id: 'sleep-low',
        title: 'Sleep dipped below your baseline',
        detail: `Weekly average ~${currentSleepAvg.toFixed(1)}h vs baseline ~${mean(baselineSleep).toFixed(1)}h.`,
      });
    }
  }

  const currentMoodAvg = avgOrNull(currentWeek.map(d => d.mood));
  const baselineMood = baseline.map(d => d.mood).filter((x): x is number => typeof x === 'number');
  if (currentMoodAvg != null && baselineMood.length >= 10) {
    const z = zScore(currentMoodAvg, baselineMood);
    if (z <= -1.3) {
      anomalies.push({
        id: 'mood-low',
        title: 'Mood is lower than usual',
        detail: `Weekly mood ~${currentMoodAvg.toFixed(1)}/5 vs baseline ~${mean(baselineMood).toFixed(1)}/5.`,
      });
    }
  }

  const currentTasksAvg = avgOrNull(currentWeek.map(d => d.tasksDone));
  const baselineTasks = baseline.map(d => d.tasksDone || 0);
  if (currentTasksAvg != null && baselineTasks.length >= 10) {
    const z = zScore(currentTasksAvg, baselineTasks);
    if (z <= -1.4) {
      anomalies.push({
        id: 'tasks-low',
        title: 'Task completion slowed down',
        detail: `Weekly ~${currentTasksAvg.toFixed(1)} done/day vs baseline ~${mean(baselineTasks).toFixed(1)}.`,
      });
    }
  }

  const currentStepsAvg = avgOrNull(currentWeek.map(d => d.steps));
  const baselineSteps = baseline.map(d => d.steps).filter((x): x is number => typeof x === 'number');
  if (currentStepsAvg != null && baselineSteps.length >= 10) {
    const z = zScore(currentStepsAvg, baselineSteps);
    if (z <= -1.4) {
      anomalies.push({
        id: 'steps-low',
        title: 'Steps are low this week',
        detail: `Avg ~${Math.round(currentStepsAvg)} steps/day vs baseline ~${Math.round(mean(baselineSteps))}.`,
      });
    }
  }

  const currentSpend = currentWeek.reduce((s, d) => s + (d.spend || 0), 0);
  const baselineSpend = baseline.map(d => d.spend || 0);
  if (baselineSpend.length >= 10) {
    const z = zScore(currentSpend, baselineSpend, 1);
    if (z >= 1.6) {
      anomalies.push({
        id: 'spend-high',
        title: 'Spending spiked vs baseline',
        detail: `Week spend ~${Math.round(currentSpend)} vs baseline avg/day ~${Math.round(mean(baselineSpend))}.`,
      });
    }
  }

  return anomalies.slice(0, 4);
}

function shouldShowThisWeek(lastShownAt: string | null, now = new Date()) {
  const weekStart = getWeekStartMonday(now);
  const thisWeekKey = toDateKey(weekStart);

  if (!lastShownAt) return true;
  const ts = Date.parse(lastShownAt);
  if (Number.isNaN(ts)) return true;

  const shown = new Date(ts);
  shown.setHours(0, 0, 0, 0);

  return toDateKey(shown) < thisWeekKey;
}

export const weeklyReviewService = {
  shouldShowThisWeek,

  async getWeeklyReview({ withAI }: { withAI: boolean }): Promise<WeeklyReview> {
    const history30 = await behaviorHistoryService.getBehaviorHistory('month');
    const { current: currentWeek, previous: prevWeek } = splitWeeks(history30);

    const currentAnalytics = calculateAnalytics(currentWeek);
    const prevAnalytics = calculateAnalytics(prevWeek);

    const delta = {
      wellnessScore: currentAnalytics.wellnessScore - prevAnalytics.wellnessScore,
      productivityIndex: currentAnalytics.productivityIndex - prevAnalytics.productivityIndex,
      consistencyScore: currentAnalytics.consistencyScore - prevAnalytics.consistencyScore,
      emotionalStability: currentAnalytics.emotionalStability - prevAnalytics.emotionalStability,
    };

    const stepsAvg = avgOrNull(currentWeek.map(d => d.steps));
    const sleepAvgHours = avgOrNull(currentWeek.map(d => d.sleepHours));
    const restingHrAvg = avgOrNull(currentWeek.map(d => d.restingHr));

    const spendTotal = currentWeek.reduce((s, d) => s + (d.spend || 0), 0);

    const correlations = pickTopCorrelations(history30);
    const anomalies = buildAnomalies(history30, currentWeek);
    const nextActions = buildNextActions(currentWeek, spendTotal);

    const profile = behavioralAIService.getCachedProfile() ?? (await behavioralAIService.refreshProfile());
    const weekOf = toDateKey(getWeekStartMonday());

    const review: WeeklyReview = {
      weekOf,
      analytics: {
        current: currentAnalytics,
        previous: prevAnalytics,
        delta,
      },
      health: {
        stepsAvg,
        sleepAvgHours,
        restingHrAvg,
      },
      correlations,
      anomalies,
      nextActions,
    };

    const weeklyEnabledRaw = (() => {
      try {
        const v = localStorage.getItem('future-weekly-recap-enabled');
        return v == null ? true : Boolean(JSON.parse(v));
      } catch {
        return true;
      }
    })();

    if (!withAI || !weeklyEnabledRaw) return review;

    const aiEnabled = await aiClientService.isAIEnabled();
    if (!aiEnabled) return review;

    try {
      const resp = await fetch('/api/ai/weekly-recap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...aiClientService.getRequestHeaders(),
        },
        body: JSON.stringify({
          weekOf,
          profile,
          analytics: {
            current: currentAnalytics,
            delta,
          },
          health: { stepsAvg, sleepAvgHours, restingHrAvg },
          correlations: correlations.map(c => ({ name: c.name, strength: c.strength, insight: c.insight })),
          anomalies,
          nextActions,
        }),
      });

      if (!resp.ok) return review;
      const data = await resp.json();

      const bullets = Array.isArray(data.bullets) ? data.bullets.map(String).slice(0, 3) : [];
      const nextStep = data.nextStep && typeof data.nextStep === 'object'
        ? {
            title: String((data.nextStep as any).title || ''),
            minutes: Number((data.nextStep as any).minutes || 0) || 0,
            route: (data.nextStep as any).route ? String((data.nextStep as any).route) : undefined,
          }
        : null;

      const why = Array.isArray(data.why) ? data.why.map(String).slice(0, 4) : undefined;

      review.ai = {
        bullets: bullets.filter(Boolean),
        nextStep: nextStep?.title ? nextStep : null,
        why,
        provider: data.provider ? String(data.provider) : undefined,
      };

      return review;
    } catch {
      return review;
    }
  },
};

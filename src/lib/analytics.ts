import type { BehaviorEntry } from '@/services/behaviorHistoryService';

export interface AnalyticsData {
  wellnessScore: number;
  productivityIndex: number;
  focusQuality: number;
  growthMomentum: number;
  consistencyScore: number;
  emotionalStability: number;
}

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

function variance(nums: number[]) {
  if (nums.length < 2) return 0;
  const avg = average(nums);
  return average(nums.map(n => (n - avg) ** 2));
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function pearsonCorrelation(pairs: Array<{ x: number; y: number }>): number {
  const n = pairs.length;
  if (n < 2) return 0;

  const sumX = pairs.reduce((s, p) => s + p.x, 0);
  const sumY = pairs.reduce((s, p) => s + p.y, 0);
  const sumXY = pairs.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = pairs.reduce((s, p) => s + p.x ** 2, 0);
  const sumY2 = pairs.reduce((s, p) => s + p.y ** 2, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  return denominator !== 0 ? numerator / denominator : 0;
}

function calculateWellnessScore(history: BehaviorEntry[]): number {
  const moodVals = history.map(h => h.mood).filter((x): x is number => typeof x === 'number');
  const sleepVals = history.map(h => h.sleepHours).filter((x): x is number => typeof x === 'number');
  const tasksDone = history.map(h => h.tasksDone || 0);
  const exerciseDays = history.filter(h => h.exerciseDone).length;

  const moodAvg = average(moodVals);
  const moodStability = 1 - clamp01(variance(moodVals) / 2);
  const sleepAvg = average(sleepVals);

  const weights = {
    mood: 0.35,
    sleep: 0.25,
    exercise: 0.15,
    goals: 0.15,
    stability: 0.10,
  };

  const moodScore = clamp01(moodAvg / 5) * 100;
  const sleepScore = clamp01(sleepAvg / 8) * 100;
  const exerciseScore = clamp01(exerciseDays / 3) * 100;
  const goalScore = clamp01(average(tasksDone) / 3) * 100;
  const stabilityScore = clamp01(moodStability) * 100;

  return (
    moodScore * weights.mood +
    sleepScore * weights.sleep +
    exerciseScore * weights.exercise +
    goalScore * weights.goals +
    stabilityScore * weights.stability
  );
}

export function calculateAnalytics(history: BehaviorEntry[]): AnalyticsData {
  const moodVals = history.map(h => h.mood).filter((x): x is number => typeof x === 'number');
  const tasksDone = history.map(h => h.tasksDone || 0);

  const wellnessScore = calculateWellnessScore(history);
  const productivityIndex = clamp01(average(tasksDone) / 5) * 100;

  const focusQuality = 0;

  const firstHalf = history.slice(0, Math.floor(history.length / 2));
  const secondHalf = history.slice(Math.floor(history.length / 2));
  const momentum = calculateWellnessScore(secondHalf) - calculateWellnessScore(firstHalf);
  const growthMomentum = Math.round(momentum);

  const daysWithActivity = history.filter(h => (h.tasksDone || 0) > 0 || (h.journalCount || 0) > 0 || typeof h.mood === 'number').length;
  const consistencyScore = clamp01(daysWithActivity / history.length) * 100;

  const emotionalStability = 100 - clamp01(variance(moodVals) / 2) * 100;

  return {
    wellnessScore: Math.round(wellnessScore),
    productivityIndex: Math.round(productivityIndex),
    focusQuality,
    growthMomentum,
    consistencyScore: Math.round(consistencyScore),
    emotionalStability: Math.round(emotionalStability),
  };
}

export function calculateTrends(history: BehaviorEntry[]) {
  return history.map(h => ({
    date: h.date,
    wellnessScore: Math.round(calculateWellnessScore([h])),
    mood: typeof h.mood === 'number' ? h.mood : null,
    tasksDone: h.tasksDone || 0,
    sleepHours: h.sleepHours ?? null,
  }));
}

export function calculateCorrelations(history: BehaviorEntry[]) {
  const correlations: Array<{ id: string; name: string; strength: number; insight: string }> = [];

  const sleepMoodPairs = history
    .filter(h => typeof h.sleepHours === 'number' && typeof h.mood === 'number')
    .map(h => ({ x: h.sleepHours as number, y: h.mood as number }));

  if (sleepMoodPairs.length > 5) {
    const corr = pearsonCorrelation(sleepMoodPairs);
    correlations.push({
      id: 'sleep-mood',
      name: 'Sleep vs mood',
      strength: corr,
      insight: corr > 0.2 ? 'More sleep tends to correlate with better mood for you.' : 'Sleep and mood are weakly correlated in your recent data.',
    });
  }

  const exerciseMoodPairs = history
    .filter(h => typeof h.mood === 'number' && typeof h.exerciseDone === 'boolean')
    .map(h => ({ x: h.exerciseDone ? 1 : 0, y: h.mood as number }));

  if (exerciseMoodPairs.length > 5) {
    const avgWith = average(exerciseMoodPairs.filter(p => p.x === 1).map(p => p.y));
    const avgWithout = average(exerciseMoodPairs.filter(p => p.x === 0).map(p => p.y));
    const strength = (avgWith - avgWithout) / 5;

    correlations.push({
      id: 'exercise-mood',
      name: 'Exercise vs mood',
      strength,
      insight: strength > 0.1 ? `On exercise days your mood is ~+${(strength * 5).toFixed(1)} points higher.` : 'Exercise days look similar to non-exercise days recently.',
    });
  }

  const tasksMoodPairs = history
    .filter(h => typeof h.mood === 'number')
    .map(h => ({ x: h.tasksDone || 0, y: h.mood as number }))
    .filter(p => p.x > 0);

  if (tasksMoodPairs.length > 5) {
    const corr = pearsonCorrelation(tasksMoodPairs);
    correlations.push({
      id: 'tasks-mood',
      name: 'Tasks done vs mood',
      strength: corr,
      insight: corr > 0.2 ? 'Finishing tasks tends to lift your mood.' : 'Task completion and mood are not strongly linked in your recent data.',
    });
  }

  return correlations.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
}

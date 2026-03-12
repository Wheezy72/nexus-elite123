import type { FinanceLimit, FinanceTransaction } from '@/hooks/useCloudData';

export function sumPositiveAmount(transactions: FinanceTransaction[]) {
  return transactions.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
}

export function groupSpendByCategory(transactions: FinanceTransaction[]) {
  const map: Record<string, number> = {};
  for (const t of transactions) {
    const k = (t.category || 'other').toLowerCase();
    map[k] = (map[k] || 0) + (t.amount > 0 ? t.amount : 0);
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}

export function dailySpendSeries(transactions: FinanceTransaction[], monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const byDay: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount <= 0) continue;
    byDay[t.date] = (byDay[t.date] || 0) + t.amount;
  }

  const out: Array<{ day: number; date: string; spend: number; cumulative: number }> = [];
  let cum = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${monthKey}-${String(day).padStart(2, '0')}`;
    const spend = Math.round(((byDay[date] || 0) * 100)) / 100;
    cum = Math.round(((cum + spend) * 100)) / 100;
    out.push({ day, date, spend, cumulative: cum });
  }
  return out;
}

export function compareMonthsSeries(current: FinanceTransaction[], prev: FinanceTransaction[], monthKey: string) {
  const currentSeries = dailySpendSeries(current, monthKey);

  const [y, m] = monthKey.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevSeries = dailySpendSeries(prev, prevKey);

  const days = Math.max(currentSeries.length, prevSeries.length);
  const out: Array<{ day: number; current: number; previous: number }> = [];
  for (let i = 0; i < days; i++) {
    out.push({
      day: i + 1,
      current: currentSeries[i]?.cumulative ?? currentSeries.at(-1)?.cumulative ?? 0,
      previous: prevSeries[i]?.cumulative ?? prevSeries.at(-1)?.cumulative ?? 0,
    });
  }
  return { prevKey, series: out };
}

export function buildSpendHeatmap(transactions: FinanceTransaction[]) {
  // Matrix: weekday x weekOfMonth (0-6 x 0-5)
  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => 0));

  for (const t of transactions) {
    if (t.amount <= 0) continue;
    const d = new Date(`${t.date}T00:00:00`);
    const weekday = (d.getDay() + 6) % 7; // Monday=0
    const weekIndex = Math.min(5, Math.floor((d.getDate() - 1) / 7));
    matrix[weekday][weekIndex] += t.amount;
  }

  const max = Math.max(0, ...matrix.flat());

  return {
    matrix,
    max,
    weekdayLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekLabels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
  };
}

export function computeRunRate(totalSpent: number, monthKey: string, now = new Date()) {
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dayOfMonth = now.getFullYear() === y && now.getMonth() + 1 === m ? now.getDate() : 1;
  const perDay = totalSpent / Math.max(1, dayOfMonth);
  return {
    perDay,
    forecastMonthEnd: perDay * daysInMonth,
    daysInMonth,
    dayOfMonth,
  };
}

export function detectAnomalies(transactions: FinanceTransaction[]) {
  const values = transactions.filter(t => t.amount > 0).map(t => t.amount).sort((a, b) => a - b);
  if (values.length < 10) return [];

  const median = values[Math.floor(values.length / 2)];
  const threshold = median * 4;

  return transactions.filter(t => t.amount > threshold).slice(0, 10);
}

export function buildLimitAlerts(
  transactions: FinanceTransaction[],
  limits: FinanceLimit[],
  now = new Date()
): Array<{ id: string; level: 'info' | 'warn'; title: string; detail: string }> {
  const alerts: Array<{ id: string; level: 'info' | 'warn'; title: string; detail: string }> = [];

  const todayKey = now.toISOString().split('T')[0];

  const sumForCategory = (cat?: string | null) => {
    const normalized = (cat || '').toLowerCase();
    return transactions.reduce((sum, t) => {
      if (t.amount <= 0) return sum;
      if (!normalized) return sum + t.amount;
      return t.category.toLowerCase() === normalized ? sum + t.amount : sum;
    }, 0);
  };

  const sumSince = (days: number, cat?: string | null) => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    cutoff.setHours(0, 0, 0, 0);

    const normalized = (cat || '').toLowerCase();

    return transactions.reduce((sum, t) => {
      if (t.amount <= 0) return sum;
      const d = new Date(`${t.date}T00:00:00`);
      if (d < cutoff) return sum;
      if (!normalized) return sum + t.amount;
      return t.category.toLowerCase() === normalized ? sum + t.amount : sum;
    }, 0);
  };

  for (const l of limits) {
    const used =
      l.period === 'monthly'
        ? sumForCategory(l.category)
        : l.period === 'weekly'
          ? sumSince(7, l.category)
          : sumSince(1, l.category);

    const warnAt = (l.warnAtPercent / 100) * l.limit;
    const pct = used / Math.max(1, l.limit);

    const scope = l.category ? `${l.category} (${l.period})` : `${l.period} limit`;

    if (used >= l.limit) {
      alerts.push({
        id: `limit-${l.id}-over`,
        level: 'warn',
        title: 'Limit exceeded',
        detail: `${scope}: ${used.toFixed(0)} spent vs ${l.limit.toFixed(0)} limit.`,
      });
    } else if (used >= warnAt) {
      alerts.push({
        id: `limit-${l.id}-warn`,
        level: 'warn',
        title: 'Limit warning',
        detail: `${scope}: ${(pct * 100).toFixed(0)}% used.`,
      });
    }

    if (l.period === 'daily' && !l.category) {
      const todaySpend = transactions.filter(t => t.date === todayKey && t.amount > 0).reduce((s, t) => s + t.amount, 0);
      if (todaySpend > 0) {
        alerts.push({
          id: `daily-${l.id}-pace`,
          level: 'info',
          title: 'Today',
          detail: `You’ve spent ${todaySpend.toFixed(0)} today.`,
        });
      }
    }
  }

  return alerts;
}

export function buildBasicAlerts(params: {
  monthKey: string;
  totalSpent: number;
  budget: number | null;
  byCategory: Array<{ name: string; value: number }>;
  now?: Date;
  limits?: FinanceLimit[];
  transactions?: FinanceTransaction[];
}) {
  const alerts: Array<{ id: string; level: 'info' | 'warn'; title: string; detail: string }> = [];

  if (params.limits && params.transactions) {
    alerts.push(...buildLimitAlerts(params.transactions, params.limits, params.now));
  }

  if (params.budget && params.budget > 0) {
    const pct = params.totalSpent / params.budget;
    if (pct >= 1) {
      alerts.push({
        id: 'budget-over',
        level: 'warn',
        title: 'Over budget',
        detail: `You’ve spent ${(pct * 100).toFixed(0)}% of your monthly budget.`,
      });
    } else if (pct >= 0.75) {
      alerts.push({
        id: 'budget-75',
        level: 'warn',
        title: 'Budget warning',
        detail: `You’re at ${(pct * 100).toFixed(0)}% of your monthly budget.`,
      });
    }

    const run = computeRunRate(params.totalSpent, params.monthKey, params.now);
    if (run.forecastMonthEnd > params.budget * 1.05) {
      alerts.push({
        id: 'runrate',
        level: 'warn',
        title: 'On pace to overspend',
        detail: `At this pace, you’ll spend about ${run.forecastMonthEnd.toFixed(0)} by month-end.`,
      });
    } else {
      alerts.push({
        id: 'runrate-ok',
        level: 'info',
        title: 'Spending pace',
        detail: `At this pace, you’ll spend about ${run.forecastMonthEnd.toFixed(0)} by month-end.`,
      });
    }
  }

  const top = params.byCategory[0];
  if (top && top.value > 0) {
    const share = params.totalSpent > 0 ? top.value / params.totalSpent : 0;
    if (share >= 0.4) {
      alerts.push({
        id: 'top-category',
        level: 'info',
        title: 'Top category',
        detail: `${top.name} is ${(share * 100).toFixed(0)}% of your spending this month.`,
      });
    }
  }

  return alerts;
}

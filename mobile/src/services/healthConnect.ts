import {
  initialize,
  requestPermission,
  readRecords,
  type Permission,
} from 'react-native-health-connect';

export type DailyHealthMetrics = {
  date: string; // YYYY-MM-DD
  steps: number | null;
  sleepMinutes: number | null;
  avgHeartRate: number | null;
};

function toDateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function startOfDay(dateKey: string) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function endOfDay(dateKey: string) {
  const t = startOfDay(dateKey);
  t.setHours(23, 59, 59, 999);
  return t;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function overlapMs(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  const s = Math.max(aStart, bStart);
  const e = Math.min(aEnd, bEnd);
  return Math.max(0, e - s);
}

export async function ensureHealthConnectReady() {
  const ok = await initialize();
  if (!ok) return false;

  const perms: Permission[] = [
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'HeartRate' },
  ];

  await requestPermission(perms);
  return true;
}

export async function readDailyMetrics(days: number, endDate = new Date()): Promise<DailyHealthMetrics[]> {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const dateKeys = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateKey(d);
  });

  const byDay: Record<string, DailyHealthMetrics & { hrSum: number; hrCount: number }> = {};
  for (const k of dateKeys) {
    byDay[k] = { date: k, steps: null, sleepMinutes: null, avgHeartRate: null, hrSum: 0, hrCount: 0 };
  }

  const range = {
    timeRangeFilter: {
      operator: 'between' as const,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  };

  // Steps
  try {
    const res = await readRecords('Steps' as any, range as any);
    const records = (res as any)?.records || [];

    for (const r of records) {
      const t = Date.parse(String(r?.startTime || r?.endTime || ''));
      if (Number.isNaN(t)) continue;
      const k = toDateKey(new Date(t));
      if (!byDay[k]) continue;
      const v = Number(r?.count);
      if (!Number.isFinite(v)) continue;
      byDay[k].steps = (byDay[k].steps || 0) + v;
    }
  } catch {
    // ignore
  }

  // Sleep
  try {
    const res = await readRecords('SleepSession' as any, range as any);
    const records = (res as any)?.records || [];

    for (const r of records) {
      const s = Date.parse(String(r?.startTime || ''));
      const e = Date.parse(String(r?.endTime || ''));
      if (Number.isNaN(s) || Number.isNaN(e)) continue;

      for (const day of dateKeys) {
        const dayStart = startOfDay(day).getTime();
        const dayEnd = endOfDay(day).getTime();
        const ms = overlapMs(s, e, dayStart, dayEnd);
        if (ms <= 0) continue;
        const minutes = Math.round(ms / 60000);
        byDay[day].sleepMinutes = (byDay[day].sleepMinutes || 0) + minutes;
      }
    }
  } catch {
    // ignore
  }

  // Heart rate (rough daily average)
  try {
    const res = await readRecords('HeartRate' as any, range as any);
    const records = (res as any)?.records || [];

    for (const r of records) {
      const samples = Array.isArray(r?.samples) ? r.samples : [];
      for (const s of samples) {
        const t = Date.parse(String(s?.time || r?.startTime || ''));
        if (Number.isNaN(t)) continue;
        const k = toDateKey(new Date(t));
        if (!byDay[k]) continue;
        const bpm = Number(s?.beatsPerMinute);
        if (!Number.isFinite(bpm)) continue;
        const clamped = clamp(bpm, 30, 220);
        byDay[k].hrSum += clamped;
        byDay[k].hrCount += 1;
      }
    }
  } catch {
    // ignore
  }

  return dateKeys.map(k => {
    const row = byDay[k];
    const avg = row.hrCount ? Math.round((row.hrSum / row.hrCount) * 10) / 10 : null;

    return {
      date: row.date,
      steps: typeof row.steps === 'number' ? Math.round(row.steps) : null,
      sleepMinutes: typeof row.sleepMinutes === 'number' ? Math.round(row.sleepMinutes) : null,
      avgHeartRate: avg,
    };
  });
}

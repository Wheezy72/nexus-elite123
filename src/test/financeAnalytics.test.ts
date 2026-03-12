import { describe, expect, it } from 'vitest';
import { buildSpendHeatmap, dailySpendSeries, groupSpendByCategory } from '@/lib/financeAnalytics';
import type { FinanceTransaction } from '@/hooks/useCloudData';

describe('financeAnalytics', () => {
  const txs: FinanceTransaction[] = [
    { id: '1', date: '2026-03-01', amount: 100, category: 'food', note: '' },
    { id: '2', date: '2026-03-01', amount: 50, category: 'food', note: '' },
    { id: '3', date: '2026-03-02', amount: 20, category: 'transport', note: '' },
  ];

  it('groups spend by category', () => {
    const grouped = groupSpendByCategory(txs);
    expect(grouped[0].name).toBe('food');
    expect(grouped[0].value).toBe(150);
  });

  it('creates a daily series', () => {
    const s = dailySpendSeries(txs, '2026-03');
    expect(s[0].spend).toBe(150);
    expect(s[1].spend).toBe(20);
    expect(s[1].cumulative).toBe(170);
  });

  it('builds a heatmap matrix', () => {
    const heat = buildSpendHeatmap(txs);
    expect(heat.matrix.length).toBe(7);
    expect(heat.matrix[0].length).toBe(6);
  });
});

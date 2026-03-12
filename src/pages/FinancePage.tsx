import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { useFinance } from '@/hooks/useCloudData';
import { toast } from 'sonner';

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const CATEGORIES = ['food', 'transport', 'rent', 'school', 'entertainment', 'health', 'other'];

const FinancePage: React.FC = () => {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const { transactions, budget, isLoading, addTransaction, deleteTransaction, setBudget } = useFinance(month);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const totalSpend = useMemo(
    () => transactions.reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0),
    [transactions]
  );

  const budgetRemaining = useMemo(() => {
    if (!budget) return null;
    return Number(budget.budget) - totalSpend;
  }, [budget, totalSpend]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      const k = t.category || 'other';
      map[k] = (map[k] || 0) + (t.amount > 0 ? t.amount : 0);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const add = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      await addTransaction.mutateAsync({ date, amount: n, category, note });
      setAmount('');
      setNote('');
      toast.success('Saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-4xl">
        <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Finance</h1>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="glass rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <GlassCard className="p-5 lg:col-span-2" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">This month</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-muted-foreground">Spent</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{totalSpend.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-muted-foreground">Budget</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{budget ? Number(budget.budget).toFixed(2) : '—'}</p>
                {budgetRemaining != null && (
                  <p className={`text-[10px] mt-1 ${budgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {budgetRemaining >= 0 ? 'Remaining' : 'Over by'} {Math.abs(budgetRemaining).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Set monthly budget"
                defaultValue={budget ? String(budget.budget) : ''}
                onKeyDown={async (e) => {
                  if (e.key !== 'Enter') return;
                  const v = Number((e.target as HTMLInputElement).value);
                  if (!Number.isFinite(v) || v <= 0) {
                    toast.error('Enter a valid budget');
                    return;
                  }
                  await setBudget.mutateAsync(v);
                  toast.success('Budget saved');
                }}
                className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
              />
              <p className="text-[10px] text-muted-foreground shrink-0">Press Enter</p>
            </div>

            <div className="mt-5">
              <h3 className="text-xs font-semibold text-foreground mb-2">Spend by category</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5" tilt={false}>
            <h2 className="text-sm font-semibold text-foreground mb-4">Add expense</h2>

            <label className="text-[11px] text-muted-foreground">Amount</label>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g., 250"
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
            />

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-[11px] text-muted-foreground">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>

            <label className="text-[11px] text-muted-foreground mt-3 block">Note (optional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g., lunch"
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
            />

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={add}
              disabled={addTransaction.isPending}
              className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Save
            </motion.button>

            <p className="text-[10px] text-muted-foreground mt-3">
              Tip: keep it simple — track categories you actually use.
            </p>
          </GlassCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <h2 className="text-sm font-semibold text-foreground mb-4">Recent</h2>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : transactions.length ? (
              <div className="space-y-2">
                {transactions.slice(0, 10).map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{t.category} · {t.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{t.date}{t.note ? ` · ${t.note}` : ''}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        await deleteTransaction.mutateAsync(t.id);
                        toast.success('Deleted');
                      }}
                      className="p-2 rounded-xl hover:bg-white/[0.04] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No transactions yet.</p>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default FinancePage;

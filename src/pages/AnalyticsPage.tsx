import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Brain, Flame, TrendingUp, Target, HeartPulse } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { behaviorHistoryService } from '@/services/behaviorHistoryService';
import { calculateActionableInsights, calculateAnalytics, calculateCorrelations, calculateTrends } from '@/lib/analytics';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}) => (
  <GlassCard className="p-4" tilt={false}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-primary" />
      <p className="text-[11px] text-muted-foreground">{title}</p>
    </div>
    <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
    <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
  </GlassCard>
);

const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof behaviorHistoryService.getBehaviorHistory>>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const h = await behaviorHistoryService.getBehaviorHistory(period);
      if (!cancelled) {
        setHistory(h);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const analytics = useMemo(() => calculateAnalytics(history), [history]);
  const trends = useMemo(() => calculateTrends(history), [history]);
  const correlations = useMemo(() => calculateCorrelations(history), [history]);
  const actionable = useMemo(() => calculateActionableInsights(history), [history]);

  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Your Patterns</h1>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            className="glass rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="quarter">Last 90 days</option>
          </select>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard title="Wellness" value={loading ? '—' : String(analytics.wellnessScore)} subtitle="Overall score" icon={HeartPulse} />
          <MetricCard title="Productivity" value={loading ? '—' : `${analytics.productivityIndex}%`} subtitle="Task momentum" icon={Target} />
          <MetricCard title="Consistency" value={loading ? '—' : `${analytics.consistencyScore}%`} subtitle="Active days" icon={Flame} />
          <MetricCard title="Mood stability" value={loading ? '—' : `${analytics.emotionalStability}%`} subtitle="Lower swings" icon={Brain} />
          <MetricCard title="Growth" value={loading ? '—' : `${analytics.growthMomentum}`} subtitle="Trend vs earlier" icon={TrendingUp} />
          <MetricCard title="Focus quality" value={loading ? '—' : `${Math.round(analytics.focusQuality * 100)}%`} subtitle="(coming soon)" icon={Activity} />
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <h2 className="text-sm font-semibold text-foreground mb-4">Wellness trend</h2>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, color: 'hsl(var(--foreground))' }} />
                  <Line type="monotone" dataKey="wellnessScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Tip: Wellness blends mood, sleep, exercise and task momentum.
            </p>
          </GlassCard>
        </motion.div>

        {actionable.length > 0 && (
          <motion.div variants={staggerItem}>
            <GlassCard className="p-5" tilt={false}>
              <h2 className="text-sm font-semibold text-foreground mb-4">Actionable insights</h2>
              <div className="space-y-2">
                {actionable.map(a => (
                  <div key={a.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs font-medium text-foreground">{a.title}</p>
                      <span className={`text-[10px] font-semibold ${a.level === 'warn' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {a.level === 'warn' ? 'Needs attention' : 'Good'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <h2 className="text-sm font-semibold text-foreground mb-4">What affects your mood</h2>
            {correlations.length ? (
              <div className="space-y-3">
                {correlations.slice(0, 4).map(c => (
                  <div key={c.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs font-medium text-foreground">{c.name}</p>
                      <p className={`text-[10px] tabular-nums ${c.strength >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.strength >= 0 ? '+' : ''}{c.strength.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{c.insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Log mood + sleep for a week to see correlations.</p>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default AnalyticsPage;

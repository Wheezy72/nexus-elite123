import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Droplets, Flame, HeartPulse, ListTodo, Timer } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import DailyQuotes from '@/components/DailyQuotes';
import ReminderManager from '@/components/ReminderManager';
import MoodQuickLog from '@/components/MoodQuickLog';
import WeeklyReviewCard, { getShouldShowWeeklyReview } from '@/components/WeeklyReviewCard';
import { useInAppReminders, useScheduledReminders, requestNotificationPermission } from '@/hooks/useReminders';
import { useTasks, useWater } from '@/hooks/useCloudData';
import { behaviorHistoryService } from '@/services/behaviorHistoryService';
import { calculateAnalytics } from '@/lib/analytics';

const Index = () => {
  useInAppReminders(true);
  useScheduledReminders();

  const { tasks } = useTasks();
  const { log, goal, upsertWater, todayKey } = useWater();

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof behaviorHistoryService.getBehaviorHistory>>>([]);
  const [showWeekly, setShowWeekly] = useState(() => getShouldShowWeeklyReview());

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const h = await behaviorHistoryService.getBehaviorHistory('week');
      if (!cancelled) {
        setHistory(h);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const analytics = useMemo(() => calculateAnalytics(history), [history]);

  const openTasks = useMemo(() => tasks.filter(t => t.column !== 'done').slice(0, 3), [tasks]);
  const focusTask = openTasks[0];

  const todayWater = log[todayKey] || 0;
  const waterPct = Math.min(todayWater / goal, 1);

  const addWater = () => {
    const newVal = todayWater + 1;
    upsertWater.mutate({ date: todayKey, glasses: newVal, goal });
  };

  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-4xl">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Wellness hero */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-6" tilt={false}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <HeartPulse className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Readiness</p>
                </div>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {loading ? '—' : analytics.wellnessScore}
                  {!loading && <span className="text-xs text-muted-foreground">/100</span>}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Based on mood, sleep, tasks, habits and hydration.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <div className="px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-[10px] text-muted-foreground">Consistency</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{loading ? '—' : `${analytics.consistencyScore}%`}</p>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-[10px] text-muted-foreground">Productivity</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{loading ? '—' : `${analytics.productivityIndex}%`}</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="w-full h-3 rounded-full bg-white/[0.05] border border-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/40 to-primary/70"
                  style={{ width: `${loading ? 0 : analytics.wellnessScore}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Link
                  to="/insights"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  See insights <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Keep the streak alive</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {showWeekly && (
          <motion.div variants={staggerItem}>
            <WeeklyReviewCard />
          </motion.div>
        )}

        {/* Top priority */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-6" tilt={false}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ListTodo className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Top priority</p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {focusTask ? focusTask.text : 'No tasks yet'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {focusTask ? 'Finish one meaningful thing today.' : 'Add 1 task and pick a priority.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/tasks"
                  className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Open Tasks
                </Link>
                <Link
                  to="/flow"
                  className="px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    <Timer className="w-4 h-4" />
                    Flow
                  </span>
                </Link>
              </div>
            </div>

            {openTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {openTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-3">
                    <p className="text-xs text-foreground/90 truncate">{t.text}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-xl border border-white/[0.08] ${
                      t.priority === 'high'
                        ? 'text-rose-300 bg-rose-500/10'
                        : t.priority === 'medium'
                          ? 'text-amber-300 bg-amber-500/10'
                          : 'text-emerald-300 bg-emerald-500/10'
                    }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Quick check-ins */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-6" tilt={false}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Quick check-ins</p>
                <p className="text-[11px] text-muted-foreground">Log fast now. Trends live in Insights.</p>
              </div>
              <Link to="/track" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                Track <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-muted-foreground mb-2">Mood</p>
                <MoodQuickLog compact />
              </div>

              <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-primary" />
                    <p className="text-xs text-muted-foreground">Water</p>
                  </div>
                  <button
                    onClick={addWater}
                    className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30"
                  >
                    +1
                  </button>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{todayWater}</p>
                    <p className="text-[11px] text-muted-foreground">of {goal} glasses</p>
                  </div>
                  <div className="w-44 h-3 rounded-full bg-white/[0.05] border border-white/[0.06] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary/40 to-primary/70" style={{ width: `${waterPct * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Secondary */}
        <motion.div variants={staggerItem} className="space-y-4">
          <ReminderManager />
          <DailyQuotes />
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default Index;

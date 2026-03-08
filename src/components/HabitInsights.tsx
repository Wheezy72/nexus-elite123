import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

interface Habit {
  id: string;
  name: string;
  emoji: string;
}

interface HabitLog {
  [date: string]: string[];
}

const MOTIVATIONAL_NUDGES = [
  "Small steps lead to big changes! 🚀",
  "Consistency beats perfection! 💪",
  "You're building something great! ⭐",
  "Keep the momentum going! 🔥",
  "Every check mark counts! ✨",
];

const HabitInsights: React.FC = () => {
  const [habits] = useLocalStorage<Habit[]>('nexus-habits', []);
  const [log] = useLocalStorage<HabitLog>('nexus-habit-log', {});

  // Get last 7 days keys
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  // Calculate completion rates per habit
  const habitStats = habits.map(h => {
    const completed = last7Days.filter(day => log[day]?.includes(h.id)).length;
    const rate = Math.round((completed / 7) * 100);
    return { ...h, completed, rate };
  });

  const best = habitStats.reduce((a, b) => (a.rate >= b.rate ? a : b), habitStats[0]);
  const worst = habitStats.reduce((a, b) => (a.rate <= b.rate ? a : b), habitStats[0]);

  const totalChecks = last7Days.reduce((sum, day) => sum + (log[day]?.length || 0), 0);
  const maxChecks = habits.length * 7;
  const overallRate = maxChecks > 0 ? Math.round((totalChecks / maxChecks) * 100) : 0;

  const nudge = MOTIVATIONAL_NUDGES[Math.floor(Math.random() * MOTIVATIONAL_NUDGES.length)];

  if (habits.length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Habit Insights</h3>
        <p className="text-xs text-muted-foreground">Add habits to see insights</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Habit Insights</h3>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>

      {/* Overall completion */}
      <div className="glass rounded-xl p-4 text-center">
        <TrendingUp className="w-5 h-5 mx-auto mb-2 text-primary" />
        <p className="text-2xl font-bold text-foreground">{overallRate}%</p>
        <p className="text-[10px] text-muted-foreground">Weekly completion rate</p>
        <div className="h-2 rounded-full bg-white/[0.05] mt-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallRate}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Best & Worst */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl p-3"
        >
          <Trophy className="w-4 h-4 text-amber-400 mb-1" />
          <p className="text-[10px] text-muted-foreground">Best Habit</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <span>{best?.emoji}</span>
            <span className="truncate">{best?.name}</span>
          </p>
          <p className="text-xs text-emerald-400">{best?.rate}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl p-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
          <p className="text-[10px] text-muted-foreground">Needs Work</p>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <span>{worst?.emoji}</span>
            <span className="truncate">{worst?.name}</span>
          </p>
          <p className="text-xs text-red-400">{worst?.rate}%</p>
        </motion.div>
      </div>

      {/* Nudge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-2 text-xs text-primary/80 bg-primary/10 rounded-lg p-3"
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>{nudge}</span>
      </motion.div>
    </GlassCard>
  );
};

export default HabitInsights;

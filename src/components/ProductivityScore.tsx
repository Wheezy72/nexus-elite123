import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Timer, CheckCircle2, Target, PenLine } from 'lucide-react';
import { useTasks, useHabits, useJournal } from '@/hooks/useCloudData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

interface FlowSession {
  id: string;
  startedAt: string;
  duration: number;
  type: 'focus' | 'break';
}

const ProductivityScore: React.FC = () => {
  const [sessions] = useLocalStorage<FlowSession[]>('future-flow-sessions', []);
  const { tasks } = useTasks();
  const { habits, logs: habitLog } = useHabits();
  const { entries: journal } = useJournal();

  // Get last 7 days
  const last7Keys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  // Focus time (max 25 points) - target: 2h/day = 14h/week
  const focusMinutes = sessions
    .filter(s => s.type === 'focus' && last7Keys.some(k => s.startedAt.startsWith(k)))
    .reduce((sum, s) => sum + s.duration, 0) / 60;
  const focusScore = Math.min(Math.round((focusMinutes / (14 * 60)) * 25), 25);

  // Tasks completed (max 25 points) - target: 3/day = 21/week
  const tasksCompleted = tasks.filter(t => 
    t.column === 'done' && last7Keys.some(k => t.createdAt.startsWith(k))
  ).length;
  const taskScore = Math.min(Math.round((tasksCompleted / 21) * 25), 25);

  // Habits checked (max 25 points) - target: all habits × 7 days
  const habitChecks = last7Keys.reduce((sum, k) => sum + (habitLog[k]?.length || 0), 0);
  const maxHabitChecks = habits.length * 7;
  const habitScore = maxHabitChecks > 0 ? Math.min(Math.round((habitChecks / maxHabitChecks) * 25), 25) : 0;

  // Journal entries (max 25 points) - target: 1/day = 7/week
  const journalEntries = journal.filter(e => 
    last7Keys.some(k => e.timestamp.startsWith(k))
  ).length;
  const journalScore = Math.min(Math.round((journalEntries / 7) * 25), 25);

  const totalScore = focusScore + taskScore + habitScore + journalScore;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Work';
  };

  const breakdown = [
    { label: 'Focus Time', score: focusScore, max: 25, icon: Timer, detail: `${Math.round(focusMinutes)}m` },
    { label: 'Tasks Done', score: taskScore, max: 25, icon: CheckCircle2, detail: `${tasksCompleted}` },
    { label: 'Habits', score: habitScore, max: 25, icon: Target, detail: `${habitChecks}/${maxHabitChecks}` },
    { label: 'Journal', score: journalScore, max: 25, icon: PenLine, detail: `${journalEntries}` },
  ];

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Productivity Score
        </h3>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>

      {/* Main score */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-6"
      >
        <div className="relative w-32 h-32 mx-auto">
          {/* Background ring */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              opacity="0.2"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - totalScore / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}</span>
            <span className="text-[10px] text-muted-foreground">{getScoreLabel(totalScore)}</span>
          </div>
        </div>
      </motion.div>

      {/* Breakdown */}
      <div className="space-y-3">
        {breakdown.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="text-foreground font-medium">{item.score}/{item.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.score / item.max) * 100}%` }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground w-12 text-right">{item.detail}</span>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

export default ProductivityScore;

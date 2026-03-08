import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

interface MoodEntry {
  id: string;
  emoji: string;
  label: string;
  date: string;
}

const moods = [
  { emoji: '😄', label: 'Amazing', value: 5, color: 'hsl(var(--primary))' },
  { emoji: '🙂', label: 'Good', value: 4, color: 'hsl(142 70% 45%)' },
  { emoji: '😐', label: 'Okay', value: 3, color: 'hsl(var(--muted-foreground))' },
  { emoji: '😔', label: 'Low', value: 2, color: 'hsl(30 80% 50%)' },
  { emoji: '😢', label: 'Rough', value: 1, color: 'hsl(0 70% 50%)' },
];

const MoodPatterns: React.FC = () => {
  const [entries] = useLocalStorage<MoodEntry[]>('nexus-mood-entries', []);

  // Last 30 days
  const recent = entries.filter(e => {
    const d = new Date(e.date);
    const ago = new Date();
    ago.setDate(ago.getDate() - 30);
    return d >= ago;
  });

  // Distribution
  const distribution = moods.map(m => ({
    name: m.label,
    emoji: m.emoji,
    value: recent.filter(e => e.emoji === m.emoji).length,
    color: m.color,
  })).filter(d => d.value > 0);

  const mostCommon = distribution.reduce((a, b) => (a.value > b.value ? a : b), distribution[0]);

  // Trend calculation
  const getTrend = () => {
    if (recent.length < 4) return 'neutral';
    const half = Math.floor(recent.length / 2);
    const older = recent.slice(0, half);
    const newer = recent.slice(half);
    
    const avgOld = older.reduce((s, e) => s + (moods.find(m => m.emoji === e.emoji)?.value || 3), 0) / older.length;
    const avgNew = newer.reduce((s, e) => s + (moods.find(m => m.emoji === e.emoji)?.value || 3), 0) / newer.length;
    
    if (avgNew > avgOld + 0.3) return 'improving';
    if (avgNew < avgOld - 0.3) return 'declining';
    return 'stable';
  };

  const trend = getTrend();
  const trendInfo = {
    improving: { label: 'Improving ↑', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    declining: { label: 'Declining ↓', color: 'text-red-400', bg: 'bg-red-500/10' },
    stable: { label: 'Stable →', color: 'text-muted-foreground', bg: 'bg-white/5' },
  }[trend];

  if (recent.length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Mood Patterns</h3>
        <p className="text-xs text-muted-foreground">Log your mood to see patterns</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Mood Patterns</h3>
        <span className="text-[10px] text-muted-foreground">Last 30 days</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={50}
                paddingAngle={3}
                dataKey="value"
              >
                {distribution.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-center space-y-1.5">
          {distribution.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="text-sm">{d.emoji}</span>
              <span className="text-[10px] text-muted-foreground flex-1">{d.name}</span>
              <span className="text-[10px] text-foreground tabular-nums">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-3 text-center"
        >
          <p className="text-[10px] text-muted-foreground mb-1">Most Common</p>
          <span className="text-2xl">{mostCommon?.emoji}</span>
          <p className="text-[10px] text-foreground">{mostCommon?.name}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`glass rounded-xl p-3 text-center ${trendInfo.bg}`}
        >
          <p className="text-[10px] text-muted-foreground mb-1">Trend</p>
          <p className={`text-sm font-medium ${trendInfo.color}`}>{trendInfo.label}</p>
          <p className="text-[10px] text-muted-foreground">{recent.length} entries</p>
        </motion.div>
      </div>
    </GlassCard>
  );
};

export default MoodPatterns;

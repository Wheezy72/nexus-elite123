import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Type, Flame, Calendar } from 'lucide-react';
import { useJournal } from '@/hooks/useCloudData';
import GlassCard from './GlassCard';

const JournalStats: React.FC = () => {
  const { entries } = useJournal();

  const totalEntries = entries.length;
  const totalWords = entries.reduce((sum, e) => sum + (e.text.trim() ? e.text.trim().split(/\s+/).length : 0), 0);
  const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

  // Calculate streak
  const getStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const hasEntry = entries.some(e => e.timestamp.startsWith(key));
      if (hasEntry) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const streak = getStreak();

  // This week entries
  const thisWeek = entries.filter(e => {
    const entryDate = new Date(e.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }).length;

  const stats = [
    { label: 'Entries', value: totalEntries, icon: FileText, color: 'text-primary' },
    { label: 'Words', value: totalWords.toLocaleString(), icon: Type, color: 'text-emerald-400' },
    { label: 'Avg/Entry', value: avgWords, icon: Calendar, color: 'text-amber-400' },
    { label: 'Streak', value: `${streak}d`, icon: Flame, color: 'text-orange-400' },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Writing Stats</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-3 text-center"
          >
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 glass rounded-xl p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">This week</span>
          <span className="text-foreground font-medium">{thisWeek} entries</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.05] mt-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((thisWeek / 7) * 100, 100)}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
};

export default JournalStats;

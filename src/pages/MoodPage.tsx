import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ArrowRight } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import MoodQuickLog from '@/components/MoodQuickLog';
import { useMood } from '@/hooks/useCloudData';

const moods = [
  { emoji: '😄', label: 'Amazing', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Low', value: 2 },
  { emoji: '😢', label: 'Rough', value: 1 },
];

const moodValueByEmoji: Record<string, number> = moods.reduce((acc, m) => {
  acc[m.emoji] = m.value;
  return acc;
}, {} as Record<string, number>);

const MoodPage = () => {
  const { entries, isLoading } = useMood();

  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => e.date.startsWith(key));
      const avg = dayEntries.length
        ? dayEntries.reduce((s, e) => s + (moodValueByEmoji[e.emoji] || 3), 0) / dayEntries.length
        : 0;
      return { day: d.toLocaleDateString('en', { weekday: 'short' }), avg: Math.round(avg * 10) / 10 };
    });
  }, [entries]);

  const weekAvg = useMemo(() => {
    const vals = last7.map(d => d.avg).filter(x => x > 0);
    if (!vals.length) return null;
    const avg = vals.reduce((s, x) => s + x, 0) / vals.length;
    return Math.round(avg * 10) / 10;
  }, [last7]);

  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl font-bold text-foreground">Mood</h1>
          <p className="text-xs text-muted-foreground mt-1">Tap an emoji to log instantly, then add optional details.</p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <h2 className="text-sm font-semibold text-foreground mb-3">How are you feeling?</h2>
            <MoodQuickLog />
          </GlassCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">This week</h2>
                <p className="text-[11px] text-muted-foreground">
                  {isLoading ? 'Loading…' : weekAvg ? `Average: ${weekAvg}/5` : 'Log a mood to see your trend.'}
                </p>
              </div>
              <Link
                to="/analytics"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Insights <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last7}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <h2 className="text-sm font-semibold text-foreground mb-3">Recent check-ins</h2>
            {entries.length ? (
              <div className="space-y-2">
                {entries.slice(0, 8).map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-xs">
                    <span className="text-lg">{e.emoji}</span>
                    <span className="text-muted-foreground w-[92px] shrink-0">{new Date(e.date).toLocaleDateString()}</span>
                    {e.triggers && e.triggers.length > 0 && (
                      <span className="text-[10px] text-primary/70 truncate">{e.triggers.join(', ')}</span>
                    )}
                    {e.note && <span className="text-foreground/70 truncate">{e.note}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No entries yet. Your first check-in takes one tap.</p>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default MoodPage;

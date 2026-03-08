import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

interface JournalEntry {
  id: string;
  text: string;
  mood: number | null;
  timestamp: string;
}

const moodEmojis = ['😤', '😔', '😐', '🙂', '😄'];

const MoodTimeline: React.FC = () => {
  const [entries] = useLocalStorage<JournalEntry[]>('nexus-journal', []);

  const moodEntries = entries
    .filter(e => e.mood !== null)
    .slice(0, 14)
    .reverse();

  const chartData = moodEntries.map(e => ({
    date: new Date(e.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    mood: e.mood,
    emoji: e.mood ? moodEmojis[e.mood - 1] : '😐',
  }));

  const avgMood = moodEntries.length > 0
    ? Math.round(moodEntries.reduce((s, e) => s + (e.mood || 3), 0) / moodEntries.length * 10) / 10
    : null;

  const trend = () => {
    if (moodEntries.length < 3) return 'neutral';
    const recent = moodEntries.slice(-3).reduce((s, e) => s + (e.mood || 3), 0) / 3;
    const older = moodEntries.slice(0, 3).reduce((s, e) => s + (e.mood || 3), 0) / 3;
    if (recent > older + 0.5) return 'improving';
    if (recent < older - 0.5) return 'declining';
    return 'stable';
  };

  const trendStatus = trend();
  const trendColor = trendStatus === 'improving' ? 'text-emerald-400' : trendStatus === 'declining' ? 'text-red-400' : 'text-muted-foreground';
  const trendLabel = trendStatus === 'improving' ? '↑ Improving' : trendStatus === 'declining' ? '↓ Declining' : '→ Stable';

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Mood Timeline</h3>
        {avgMood && (
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{moodEmojis[Math.round(avgMood) - 1]}</span>
            <span className="text-xs text-muted-foreground">avg {avgMood}</span>
          </div>
        )}
      </div>

      {moodEntries.length > 0 ? (
        <>
          <div className="h-24 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                  formatter={(value: number) => [moodEmojis[value - 1], 'Mood']}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{moodEntries.length} mood entries</span>
            <span className={trendColor}>{trendLabel}</span>
          </div>

          {/* Recent emoji timeline */}
          <div className="flex justify-center gap-1 mt-3">
            {chartData.slice(-7).map((d, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-lg"
                title={d.date}
              >
                {d.emoji}
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No mood data yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Add moods to your journal entries</p>
        </div>
      )}
    </GlassCard>
  );
};

export default MoodTimeline;

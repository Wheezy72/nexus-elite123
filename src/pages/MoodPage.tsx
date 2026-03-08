import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rewardAction } from '@/lib/rewards';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import PageLayout from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import MicroLogger from '@/components/MicroLogger';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface MoodEntry {
  id: string;
  emoji: string;
  label: string;
  note: string;
  date: string;
}

const moods = [
  { emoji: '😄', label: 'Amazing', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Low', value: 2 },
  { emoji: '😢', label: 'Rough', value: 1 },
];

const MoodPage = () => {
  const [entries, setEntries] = useLocalStorage<MoodEntry[]>('nexus-mood-entries', []);
  const [selectedMood, setSelectedMood] = useState<typeof moods[0] | null>(null);
  const [note, setNote] = useState('');

  const logMood = () => {
    if (!selectedMood) return;
    setEntries(prev => [...prev, {
      id: crypto.randomUUID(),
      emoji: selectedMood.emoji,
      label: selectedMood.label,
      note,
      date: new Date().toISOString(),
    }]);
    setSelectedMood(null);
    setNote('');
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const dayEntries = entries.filter(e => e.date.startsWith(key));
    const avg = dayEntries.length
      ? dayEntries.reduce((s, e) => s + (moods.find(m => m.emoji === e.emoji)?.value || 3), 0) / dayEntries.length
      : 0;
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), avg: Math.round(avg * 10) / 10 };
  });

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Mood Tracker</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick log */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">How are you feeling?</h2>
          <div className="flex justify-between mb-4">
            {moods.map(m => (
              <motion.button
                key={m.label}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedMood(m)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                  selectedMood?.label === m.label
                    ? 'bg-primary/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </motion.button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground bg-transparent outline-none resize-none h-20 mb-3"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={logMood}
            disabled={!selectedMood}
            className="w-full py-2.5 rounded-xl bg-primary/20 text-primary text-sm font-medium disabled:opacity-30 hover:bg-primary/30 transition-colors"
          >
            Log Mood
          </motion.button>
        </GlassCard>

        {/* Chart */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Weekly Mood</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last7}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
              <Bar dataKey="avg" fill="hsl(226 70% 55.5%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Recent entries */}
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
            {entries.slice(-5).reverse().map(e => (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span>{e.emoji}</span>
                <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                {e.note && <span className="text-foreground/70 truncate">{e.note}</span>}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Existing micro logger */}
        <div className="lg:col-span-2">
          <MicroLogger />
        </div>
      </div>
    </PageLayout>
  );
};

export default MoodPage;

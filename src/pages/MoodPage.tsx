import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import MicroLogger from '@/components/MicroLogger';
import MoodPatterns from '@/components/MoodPatterns';
import { useMood } from '@/hooks/useCloudData';

const moods = [
  { emoji: '😄', label: 'Amazing', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Low', value: 2 },
  { emoji: '😢', label: 'Rough', value: 1 },
];

const TRIGGERS = [
  { emoji: '💼', label: 'Work' },
  { emoji: '🏃', label: 'Exercise' },
  { emoji: '👥', label: 'Social' },
  { emoji: '😴', label: 'Sleep' },
  { emoji: '🌤️', label: 'Weather' },
  { emoji: '🍽️', label: 'Food' },
  { emoji: '💊', label: 'Health' },
  { emoji: '🎮', label: 'Leisure' },
];

const MoodPage = () => {
  const { entries, addEntry } = useMood();
  const [selectedMood, setSelectedMood] = useState<typeof moods[0] | null>(null);
  const [note, setNote] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);

  const toggleTrigger = (label: string) => {
    setSelectedTriggers(prev => 
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const logMood = () => {
    if (!selectedMood) return;
    haptic('success');
    addEntry.mutate({
      emoji: selectedMood.emoji,
      label: selectedMood.label,
      note,
      date: new Date().toISOString(),
      triggers: selectedTriggers,
    });
    setSelectedMood(null);
    setNote('');
    setSelectedTriggers([]);
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
      <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Mood Tracker</motion.h1>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">How are you feeling?</h2>
            <div className="flex justify-between mb-4">
              {moods.map(m => (
                <motion.button
                  key={m.label}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedMood(m)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                    selectedMood?.label === m.label ? 'bg-primary/20 glow-primary' : 'hover:bg-accent/20'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground mb-2">What influenced this? (optional)</p>
              <div className="flex flex-wrap gap-2">
                {TRIGGERS.map(t => (
                  <motion.button
                    key={t.label}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleTrigger(t.label)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                      selectedTriggers.includes(t.label) ? 'bg-primary/20 text-primary' : 'glass text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full glass rounded-2xl px-4 py-3 text-sm text-foreground bg-transparent outline-none resize-none h-20 mb-3"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={logMood}
              disabled={!selectedMood}
              className="w-full py-2.5 rounded-2xl bg-primary/20 text-primary text-sm font-medium disabled:opacity-30 hover:bg-primary/30 transition-colors"
            >
              Log Mood
            </motion.button>
          </GlassCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <MoodPatterns />
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Weekly Mood</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={last7}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {entries.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs">
                  <span>{e.emoji}</span>
                  <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                  {e.triggers && e.triggers.length > 0 && (
                    <span className="text-[9px] text-primary/60">{e.triggers.join(', ')}</span>
                  )}
                  {e.note && <span className="text-foreground/70 truncate">{e.note}</span>}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2">
          <MicroLogger />
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default MoodPage;

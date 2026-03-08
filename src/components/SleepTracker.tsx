import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Plus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface SleepEntry {
  id: string;
  date: string;
  bedtime: string; // HH:MM
  wakeTime: string; // HH:MM
  quality: number; // 1-5
  hoursSlept: number;
}

const qualityLabels = ['😫', '😔', '😐', '🙂', '😴'];

function calcHours(bed: string, wake: string): number {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  return Math.round((wakeMin - bedMin) / 60 * 10) / 10;
}

const SleepTracker: React.FC = () => {
  const [entries, setEntries] = useLocalStorage<SleepEntry[]>('nexus-sleep', []);
  const [showAdd, setShowAdd] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);

  const save = () => {
    const hours = calcHours(bedtime, wakeTime);
    setEntries(prev => [{
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      bedtime,
      wakeTime,
      quality,
      hoursSlept: hours,
    }, ...prev]);
    setShowAdd(false);
  };

  const weekData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const entry = entries.find(e => e.date === dateStr);
      data.push({
        day: dayLabel,
        hours: entry?.hoursSlept || 0,
        quality: entry ? entry.quality * 20 : 0,
      });
    }
    return data;
  }, [entries]);

  const avgHours = entries.length > 0
    ? Math.round(entries.slice(0, 7).reduce((a, e) => a + e.hoursSlept, 0) / Math.min(entries.length, 7) * 10) / 10
    : 0;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Sleep</h2>
          {avgHours > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary tabular-nums">
              avg {avgHours}h
            </span>
          )}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(!showAdd)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
            <div className="glass rounded-xl p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><Moon className="w-3 h-3" /> Bedtime</label>
                  <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} className="w-full glass rounded-lg px-2 py-1.5 text-xs text-foreground bg-transparent outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1"><Sun className="w-3 h-3" /> Wake</label>
                  <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="w-full glass rounded-lg px-2 py-1.5 text-xs text-foreground bg-transparent outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Quality</label>
                <div className="flex gap-1">
                  {qualityLabels.map((emoji, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => setQuality(i + 1)}
                      className={`w-9 h-9 rounded-lg text-base flex items-center justify-center transition-colors ${quality === i + 1 ? 'bg-primary/20' : 'glass'}`}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="text-center text-xs text-muted-foreground">
                {calcHours(bedtime, wakeTime)}h of sleep
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={save} className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Log Sleep</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <EmptyState icon={Moon} title="No sleep data" description="Log your sleep to track patterns" actionLabel="Log Sleep" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} domain={[0, 12]} />
              <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="hours" fill="hsl(226, 70%, 55.5%)" radius={[4, 4, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GlassCard>
  );
};

export default SleepTracker;

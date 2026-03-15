import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Plus, X, TrendingUp, TrendingDown, Star, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useSleep } from '@/hooks/useCloudData';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

const qualityLabels = ['Awful', 'Poor', 'Fair', 'Good', 'Great'];
const qualityColors = ['text-red-400', 'text-orange-400', 'text-muted-foreground', 'text-emerald-400', 'text-primary'];
const qualityDots = ['bg-red-400', 'bg-orange-400', 'bg-muted-foreground', 'bg-emerald-400', 'bg-primary'];

function calcHours(bed: string, wake: string): number {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let bedMin = bh * 60 + bm;
  let wakeMin = wh * 60 + wm;
  if (wakeMin <= bedMin) wakeMin += 24 * 60;
  return Math.round((wakeMin - bedMin) / 60 * 10) / 10;
}

const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
  const [display, setDisplay] = React.useState(value.toFixed(1));
  React.useEffect(() => { setDisplay(value.toFixed(1)); }, [value]);
  return <span>{display}{suffix}</span>;
};

const barStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const barColors = ['hsl(250, 70%, 55%)', 'hsl(240, 65%, 52%)', 'hsl(230, 65%, 50%)', 'hsl(226, 70%, 55%)', 'hsl(220, 65%, 52%)', 'hsl(210, 65%, 50%)', 'hsl(200, 70%, 48%)'];

const SleepTracker: React.FC = () => {
  const { entries, addEntry } = useSleep();
  const [showAdd, setShowAdd] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);

  const save = () => {
    const hours = calcHours(bedtime, wakeTime);
    addEntry.mutate({
      date: new Date().toISOString().split('T')[0],
      bedtime,
      wakeTime,
      quality,
      hoursSlept: hours,
    });
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
      data.push({ day: dayLabel, hours: entry?.hoursSlept || 0, quality: entry?.quality || 0 });
    }
    return data;
  }, [entries]);

  const last7 = entries.slice(0, 7);
  const avgHours = last7.length > 0 ? Math.round(last7.reduce((a, e) => a + e.hoursSlept, 0) / last7.length * 10) / 10 : 0;
  const avgQuality = last7.length > 0 ? Math.round(last7.reduce((a, e) => a + e.quality, 0) / last7.length * 10) / 10 : 0;
  const bestNight = last7.length > 0 ? last7.reduce((best, e) => e.hoursSlept > best.hoursSlept ? e : best) : null;
  const worstNight = last7.length > 0 ? last7.reduce((worst, e) => e.hoursSlept < worst.hoursSlept ? e : worst) : null;
  const recentEntries = entries.slice(0, 5);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Sleep</h2>
          {avgHours > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary tabular-nums">
              avg <AnimatedNumber value={avgHours} suffix="h" />
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
                <label className="text-[10px] text-muted-foreground block mb-1.5">Quality</label>
                <div className="flex gap-1">
                  {qualityLabels.map((label, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.08 }}
                      onClick={() => setQuality(i + 1)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                        quality === i + 1 ? `bg-primary/20 ${qualityColors[i]} shadow-[0_0_10px_hsl(var(--primary)_/_0.18)]` : 'glass text-muted-foreground/60'
                      }`}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="text-center text-xs text-muted-foreground">{calcHours(bedtime, wakeTime)}h of sleep</div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={save} className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Log Sleep</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <EmptyState icon={Moon} title="No sleep data" description="Log your sleep to track patterns" actionLabel="Log Sleep" onAction={() => setShowAdd(true)} />
      ) : (
        <motion.div variants={barStagger} initial="hidden" animate="show">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="glass rounded-lg p-2.5 text-center">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">Avg Quality</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-amber-400" />
                <span className="text-sm font-bold text-foreground">{avgQuality.toFixed(1)}</span>
              </div>
            </div>
            {bestNight && (
              <div className="glass rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">Best</p>
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-sm font-bold text-foreground">{bestNight.hoursSlept}h</span>
                </div>
              </div>
            )}
            {worstNight && (
              <div className="glass rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">Worst</p>
                <div className="flex items-center justify-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-sm font-bold text-foreground">{worstNight.hoursSlept}h</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-[140px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} domain={[0, 12]} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [`${value}h`, 'Sleep']} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} name="Hours">
                  {weekData.map((_, i) => (<Cell key={i} fill={barColors[i]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {recentEntries.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-2">Recent</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {recentEntries.map((entry, i) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass rounded-lg p-2 min-w-[90px] shrink-0">
                    <p className="text-[9px] text-muted-foreground/60 mb-1">{new Date(entry.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground/40" />
                      <span className="text-xs font-semibold text-foreground">{entry.hoursSlept}h</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${qualityDots[entry.quality - 1]}`} />
                      <span className={`text-[9px] ${qualityColors[entry.quality - 1]}`}>{qualityLabels[entry.quality - 1]}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </GlassCard>
  );
};

export default SleepTracker;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus, Minus, RotateCcw } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const GOAL = 8; // glasses

const WaterPage = () => {
  const todayKey = new Date().toISOString().split('T')[0];
  const [log, setLog] = useLocalStorage<Record<string, number>>('nexus-water-log', {});
  const [goal, setGoal] = useLocalStorage<number>('nexus-water-goal', GOAL);

  const current = log[todayKey] || 0;
  const pct = Math.min(current / goal, 1);

  const add = (n: number) => setLog(prev => ({ ...prev, [todayKey]: Math.max(0, (prev[todayKey] || 0) + n) }));
  const reset = () => setLog(prev => ({ ...prev, [todayKey]: 0 }));

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = d.toISOString().split('T')[0];
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), count: log[k] || 0 };
  });

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Hydration Tracker</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Glass fill animation */}
        <GlassCard className="p-8 flex flex-col items-center">
          <div className="relative w-40 h-56 rounded-2xl border-2 border-primary/20 overflow-hidden mb-6">
            {/* Water fill */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/40 to-primary/20"
              animate={{ height: `${pct * 100}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
            {/* Wave effect */}
            <motion.div
              className="absolute left-0 right-0 h-3"
              style={{ bottom: `${pct * 100}%` }}
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <svg viewBox="0 0 160 12" className="w-full">
                <path d="M0 6 Q20 0 40 6 Q60 12 80 6 Q100 0 120 6 Q140 12 160 6 V12 H0Z" fill="hsl(226 70% 55.5% / 0.3)" />
              </svg>
            </motion.div>
            {/* Count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <Droplets className="w-6 h-6 text-primary mb-1" />
              <span className="text-3xl font-bold text-foreground tabular-nums">{current}</span>
              <span className="text-xs text-muted-foreground">of {goal} glasses</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => add(-1)}
              className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground">
              <Minus className="w-5 h-5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => add(1)}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.3)]">
              <Plus className="w-6 h-6" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={reset}
              className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Goal adjust */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs text-muted-foreground">Daily goal:</span>
            <input
              type="number"
              min={1}
              max={20}
              value={goal}
              onChange={e => setGoal(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-16 glass rounded-lg px-2 py-1 text-sm text-foreground bg-transparent outline-none text-center tabular-nums"
            />
          </div>
        </GlassCard>

        {/* Weekly view */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">This Week</h2>
          <div className="space-y-3">
            {last7.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">{d.day}</span>
                <div className="flex-1 h-6 glass rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary/40 to-primary/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((d.count / goal) * 100, 100)}%` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-foreground tabular-nums w-6 text-right">{d.count}</span>
                {d.count >= goal && <span className="text-xs">✅</span>}
              </div>
            ))}
          </div>

          {/* Streak */}
          <div className="mt-6 p-4 glass rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {(() => {
                let streak = 0;
                for (let i = 0; i < 30; i++) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const k = d.toISOString().split('T')[0];
                  if ((log[k] || 0) >= goal) streak++;
                  else if (i > 0) break;
                }
                return streak;
              })()}
            </p>
            <p className="text-[10px] text-muted-foreground">days hitting goal</p>
          </div>
        </GlassCard>
      </div>
    </PageLayout>
  );
};

export default WaterPage;

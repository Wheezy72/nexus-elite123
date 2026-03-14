import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { getAchievementDefs, getGameState, getXPForNextLevel } from '@/lib/gamification';

const AchievementsPage: React.FC = () => {
  const [state, setState] = useState(getGameState());

  useEffect(() => {
    const handler = () => setState(getGameState());
    window.addEventListener('nexus-game-update', handler);
    return () => window.removeEventListener('nexus-game-update', handler);
  }, []);

  const defs = useMemo(() => getAchievementDefs(), []);
  const progress = getXPForNextLevel(state);

  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
        <motion.div variants={staggerItem} className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Level</p>
            <p className="text-lg font-bold text-foreground tabular-nums">{state.level}</p>
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">XP</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{state.xp}</p>
              </div>
              {state.level < 50 ? (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Next level</p>
                  <p className="text-xs text-foreground tabular-nums">{progress.current} / {progress.needed}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Max level reached</p>
              )}
            </div>
            {state.level < 50 && (
              <div className="mt-3 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-violet-400"
                  style={{ width: `${progress.needed ? (progress.current / progress.needed) * 100 : 0}%` }}
                />
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                {state.achievements.length} / {defs.length} trophies
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {defs.map((d, idx) => {
                const unlocked = state.achievements.includes(d.id);
                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`p-4 rounded-2xl border ${
                      unlocked ? 'border-primary/30 bg-primary/10' : 'border-white/[0.06] bg-white/[0.03] opacity-70'
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{d.desc}</p>
                    <p className={`text-[10px] mt-2 ${unlocked ? 'text-emerald-400' : 'text-rose-300'}`}>
                      {unlocked ? 'Unlocked' : 'Locked'}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default AchievementsPage;

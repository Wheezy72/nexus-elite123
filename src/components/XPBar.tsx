import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, Trophy, Zap } from 'lucide-react';
import { getGameState, getXPForNextLevel, type GameState } from '@/lib/gamification';

const XPBar: React.FC = () => {
  const [state, setState] = useState<GameState>(getGameState());
  
  useEffect(() => {
    const handler = () => setState(getGameState());
    window.addEventListener('future-game-update', handler);
    // Also check on mount
    handler();
    return () => window.removeEventListener('future-game-update', handler);
  }, []);

  const { current, needed } = getXPForNextLevel(state);
  const pct = Math.min((current / needed) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Level {state.level}</p>
            <p className="text-[10px] text-muted-foreground">{state.xp} total XP</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {state.streakDays > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-bold text-orange-400 tabular-nums">{state.streakDays}d</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 tabular-nums">{state.achievements.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary tabular-nums">{state.totalActions}</span>
          </div>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, type: 'spring' }}
        />
      </div>
      <p className="text-[9px] text-muted-foreground/60 mt-1 text-right tabular-nums">
        {current}/{needed} XP to level {state.level + 1}
      </p>
    </motion.div>
  );
};

export default XPBar;

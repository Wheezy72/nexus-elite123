import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, X, RotateCcw, Minus, Award } from 'lucide-react';
import { useGoals } from '@/hooks/useCloudData';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';
import { rewardAction } from '@/lib/rewards';

const GoalTracker: React.FC = () => {
  const { goals, addGoal: addGoalMut, updateGoal: updateGoalMut, deleteGoal: deleteGoalMut } = useGoals();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');

  const addGoal = () => {
    if (!name.trim() || !target) return;
    addGoalMut.mutate({ name: name.trim(), target: Number(target), unit: unit.trim() || 'times', period });
    setName(''); setTarget(''); setUnit(''); setShowAdd(false);
  };

  const increment = (id: string, amount = 1) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    const newCurrent = Math.min(goal.current + amount, goal.target);
    const wasComplete = goal.current >= goal.target;
    const isNowComplete = newCurrent >= goal.target;
    if (!wasComplete && isNowComplete) rewardAction('goal_complete');
    else rewardAction('goal_increment');
    updateGoalMut.mutate({ id, current: newCurrent });
  };

  const decrement = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;
    updateGoalMut.mutate({ id, current: Math.max(goal.current - 1, 0) });
  };

  const removeGoal = (id: string) => {
    deleteGoalMut.mutate(id);
  };

  const resetGoal = (id: string) => {
    updateGoalMut.mutate({ id, current: 0 });
  };

  const completedCount = goals.filter(g => g.current >= g.target).length;

  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Goals</h2>
          {goals.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{completedCount}/{goals.length} achieved</p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(!showAdd)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            showAdd ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="glass rounded-xl p-3 space-y-2.5">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="What's your goal?" className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40" autoFocus />
              <div className="flex gap-2 flex-wrap">
                <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="Target" className="w-20 glass rounded-lg px-2.5 py-1.5 text-xs text-foreground bg-transparent outline-none tabular-nums" />
                <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unit" className="w-20 glass rounded-lg px-2.5 py-1.5 text-xs text-foreground bg-transparent outline-none" />
                <div className="flex gap-1 ml-auto">
                  {(['daily', 'weekly'] as const).map(p => (
                    <motion.button key={p} whileTap={{ scale: 0.9 }} onClick={() => setPeriod(p)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${period === p ? 'bg-primary/20 text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={addGoal} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                Create Goal
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals set" description="Define a goal to stay focused and measure progress" actionLabel="Set a Goal" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = Math.round((goal.current / goal.target) * 100);
            const isComplete = goal.current >= goal.target;

            return (
              <motion.div key={goal.id} layout className={`glass rounded-xl p-3.5 group transition-all ${isComplete ? 'border-emerald-500/20' : ''}`}>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{goal.name}</p>
                      {isComplete && <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground tabular-nums">{goal.current} / {goal.target} {goal.unit}</span>
                      <span className="text-[9px] px-1.5 py-px rounded-md bg-white/[0.04] text-muted-foreground/60 font-medium">{goal.period}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold tabular-nums ${isComplete ? 'text-emerald-400' : 'text-foreground'}`}>{pct}%</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden mb-2.5">
                  <motion.div
                    className={`h-full rounded-full ${isComplete ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-primary to-primary/70'}`}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  {!isComplete ? (
                    <div className="flex gap-1">
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => decrement(goal.id)} className="text-[10px] w-6 h-6 rounded-md bg-white/[0.04] text-muted-foreground hover:text-foreground flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => increment(goal.id)} className="text-[10px] px-3 h-6 rounded-md bg-primary/15 text-primary font-medium flex items-center justify-center gap-0.5">
                        <Plus className="w-3 h-3" /> 1
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => increment(goal.id, 5)} className="text-[10px] px-3 h-6 rounded-md bg-primary/10 text-primary/70 font-medium flex items-center justify-center gap-0.5">
                        <Plus className="w-3 h-3" /> 5
                      </motion.button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-medium">Goal achieved</span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => resetGoal(goal.id)} className="p-1 text-muted-foreground/40 hover:text-foreground" title="Reset">
                      <RotateCcw className="w-3 h-3" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeGoal(goal.id)} className="p-1 text-muted-foreground/40 hover:text-destructive" title="Delete">
                      <X className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default GoalTracker;

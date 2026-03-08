import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, X, Trophy } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  period: 'daily' | 'weekly';
  createdAt: string;
}

const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useLocalStorage<Goal[]>('nexus-goals', []);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');

  const addGoal = () => {
    if (!name.trim() || !target) return;
    setGoals(prev => [...prev, {
      id: crypto.randomUUID(),
      name: name.trim(),
      target: Number(target),
      current: 0,
      unit: unit.trim() || 'times',
      period,
      createdAt: new Date().toISOString(),
    }]);
    setName(''); setTarget(''); setUnit(''); setShowAdd(false);
  };

  const increment = (id: string, amount = 1) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current: Math.min(g.current + amount, g.target) } : g));
  };

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const resetGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current: 0 } : g));
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Goals</h2>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(!showAdd)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground">
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
            <div className="glass rounded-xl p-3 space-y-2">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Goal name..." className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50" />
              <div className="flex gap-2">
                <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="Target" className="w-20 glass rounded-lg px-2 py-1 text-xs text-foreground bg-transparent outline-none" />
                <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="unit" className="w-20 glass rounded-lg px-2 py-1 text-xs text-foreground bg-transparent outline-none" />
                <div className="flex gap-1 ml-auto">
                  {(['daily', 'weekly'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)} className={`text-[10px] px-2 py-1 rounded-lg ${period === p ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={addGoal} className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Add Goal</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals" description="Set a goal to stay on track" actionLabel="Set Goal" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = Math.round((goal.current / goal.target) * 100);
            const isComplete = goal.current >= goal.target;
            const circumference = 2 * Math.PI * 28;
            const offset = circumference * (1 - pct / 100);

            return (
              <motion.div key={goal.id} layout className="glass rounded-xl p-3 flex items-center gap-3 group">
                {/* Progress ring */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <motion.circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke={isComplete ? 'hsl(142, 70%, 45%)' : 'hsl(var(--primary))'}
                      strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      initial={false}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isComplete ? (
                      <Trophy className="w-4 h-4 text-green-400" />
                    ) : (
                      <span className="text-xs font-bold tabular-nums text-foreground">{pct}%</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{goal.name}</p>
                  <p className="text-[10px] text-muted-foreground">{goal.current}/{goal.target} {goal.unit} · {goal.period}</p>
                  {!isComplete && (
                    <div className="flex gap-1 mt-1.5">
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => increment(goal.id)} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/20 text-primary">+1</motion.button>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => increment(goal.id, 5)} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary/80">+5</motion.button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => resetGoal(goal.id)} className="text-[9px] text-muted-foreground hover:text-foreground">reset</button>
                  <button onClick={() => removeGoal(goal.id)}><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
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

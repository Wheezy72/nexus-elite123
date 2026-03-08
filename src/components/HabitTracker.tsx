import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, X, Flame, Target } from 'lucide-react';
import { useHabits } from '@/hooks/useCloudData';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

const EMOJIS = ['🎯', '🏃', '🧠', '💊', '🥗', '😴', '🎨', '🎸', '🌿', '☀️'];

function getDateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

function getLast7Days() {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function getStreak(log: Record<string, string[]>, habitId: string): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getDateKey(d);
    if (log[key]?.includes(habitId)) {
      streak++;
    } else if (i > 0) break;
    else break;
  }
  return streak;
}

const HabitTracker: React.FC = () => {
  const { habits, logs: log, addHabit: addHabitMut, removeHabit: removeHabitMut, toggleLog } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎯');

  const days = getLast7Days();
  const today = getDateKey(new Date());

  const toggle = (habitId: string, dateKey: string) => {
    toggleLog.mutate({ habitId, date: dateKey });
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    addHabitMut.mutate({ name: newName.trim(), emoji: newEmoji });
    setNewName('');
    setShowAdd(false);
  };

  const removeHabit = (id: string) => {
    removeHabitMut.mutate(id);
  };

  const todayCompleted = log[today]?.length || 0;
  const todayTotal = habits.length;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Habits</h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary tabular-nums">
            {todayCompleted}/{todayTotal}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(!showAdd)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="glass rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Habit name..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
                  onKeyDown={e => e.key === 'Enter' && addHabit()}
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={addHabit} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                  Add
                </motion.button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition-colors ${newEmoji === e ? 'bg-primary/20' : 'hover:bg-accent/50'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {habits.length === 0 ? (
        <EmptyState icon={Target} title="No habits" description="Add habits to start tracking" actionLabel="Add Habit" onAction={() => setShowAdd(true)} />
      ) : (
        <>
          <div className="grid gap-1" style={{ gridTemplateColumns: `1fr repeat(7, 32px)` }}>
            <div />
            {days.map(d => (
              <div key={d.toISOString()} className="text-center">
                <span className="text-[9px] text-muted-foreground uppercase">
                  {d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                </span>
              </div>
            ))}

            {habits.map(habit => (
              <React.Fragment key={habit.id}>
                <div className="flex items-center gap-1.5 pr-2 min-w-0 group">
                  <span className="text-sm">{habit.emoji}</span>
                  <span className="text-xs text-foreground truncate">{habit.name}</span>
                  <button onClick={() => removeHabit(habit.id)} className="opacity-0 group-hover:opacity-100 ml-auto shrink-0 transition-opacity">
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
                {days.map(d => {
                  const key = getDateKey(d);
                  const done = log[key]?.includes(habit.id);
                  return (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.75 }}
                      animate={done ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      onClick={() => toggle(habit.id, key)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        done ? 'bg-primary/25 text-primary' : 'glass text-muted-foreground/30 hover:text-muted-foreground'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" />}
                    </motion.button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="flex gap-3 mt-4 overflow-x-auto">
            {habits.map(h => {
              const s = getStreak(log, h.id);
              return s > 0 ? (
                <div key={h.id} className="glass rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shrink-0">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] text-foreground font-medium">{h.emoji} {s}d</span>
                </div>
              ) : null;
            })}
          </div>
        </>
      )}
    </GlassCard>
  );
};

export default HabitTracker;

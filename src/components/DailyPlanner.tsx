import React from 'react';
import { motion } from 'framer-motion';
import { Target, Star, Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useCloudData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { haptic } from '@/lib/haptics';
import GlassCard from './GlassCard';

const DailyPlanner: React.FC = () => {
  const { tasks } = useTasks();
  const [priorities, setPriorities] = useLocalStorage<string[]>('future-daily-priorities', []);

  const incompleteTasks = tasks.filter(t => t.column !== 'done');
  const topTask = incompleteTasks.find(t => t.priority === 'high') || incompleteTasks[0];

  const togglePriority = (taskId: string) => {
    haptic('light');
    setPriorities(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : prev.length < 3 ? [...prev, taskId] : prev
    );
  };

  const priorityTasks = tasks.filter(t => priorities.includes(t.id) && t.column !== 'done');

  // Drop priorities that reference deleted/completed tasks.
  React.useEffect(() => {
    const valid = new Set(tasks.filter(t => t.column !== 'done').map(t => t.id));
    setPriorities(prev => prev.filter(id => valid.has(id)));
  }, [tasks, setPriorities]);

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Today's Focus
        </h3>
        <span className="text-[10px] text-muted-foreground">{priorityTasks.length}/3 set</span>
      </div>

      {/* Priority slots */}
      <div className="space-y-2">
        {[0, 1, 2].map(i => {
          const task = priorityTasks[i];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass rounded-xl p-3 flex items-center gap-3 ${
                task ? 'border-l-2 border-l-primary/40' : 'border border-dashed border-white/10'
              }`}
            >
              <span className="text-xs font-bold text-primary/50 w-5">#{i + 1}</span>
              {task ? (
                <>
                  <p className="text-xs text-foreground flex-1 truncate">{task.text}</p>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => togglePriority(task.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  </motion.button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground/40 flex-1">Pick a priority task</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pick from tasks */}
      {priorityTasks.length < 3 && incompleteTasks.length > 0 && (
        <div className="space-y-1.5 max-h-28 overflow-y-auto">
          <p className="text-[10px] text-muted-foreground">Select up to 3:</p>
          {incompleteTasks.filter(t => !priorities.includes(t.id)).slice(0, 5).map(task => (
            <motion.button
              key={task.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => togglePriority(task.id)}
              className="w-full text-left glass rounded-lg p-2 flex items-center gap-2 hover:bg-white/[0.03]"
            >
              <Star className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-[11px] text-muted-foreground truncate">{task.text}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Pomodoro link */}
      {topTask && (
        <Link to="/flow">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="glass rounded-xl p-3 flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent cursor-pointer hover:from-primary/15 transition-colors"
          >
            <Play className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary/80">Start Focus Session</p>
              <p className="text-xs text-foreground truncate">{topTask.text}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary/60" />
          </motion.div>
        </Link>
      )}
    </GlassCard>
  );
};

export default DailyPlanner;

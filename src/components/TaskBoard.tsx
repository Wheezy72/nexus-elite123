import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, CheckCircle2, Circle, Trash2, ListTodo, ArrowRight, Clock, ChevronDown, Filter } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface Task {
  id: string;
  text: string;
  column: 'todo' | 'progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const COLUMNS = [
  { key: 'todo' as const, label: 'To Do', icon: Circle, accent: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  { key: 'progress' as const, label: 'In Progress', icon: Clock, accent: 'text-primary', dot: 'bg-primary' },
  { key: 'done' as const, label: 'Done', icon: CheckCircle2, accent: 'text-emerald-400', dot: 'bg-emerald-400' },
];

const PRIORITIES = [
  { key: 'low' as const, label: 'Low', class: 'border-muted-foreground/20 text-muted-foreground' },
  { key: 'medium' as const, label: 'Med', class: 'border-amber-500/30 text-amber-400' },
  { key: 'high' as const, label: 'High', class: 'border-red-500/30 text-red-400' },
];

const priorityOrder = { high: 0, medium: 1, low: 2 };

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('nexus-tasks', []);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | Task['priority']>('all');

  const addTask = () => {
    if (!newText.trim()) return;
    setTasks(prev => [...prev, {
      id: crypto.randomUUID(),
      text: newText.trim(),
      column: 'todo',
      priority: newPriority,
      createdAt: new Date().toISOString(),
    }]);
    setNewText('');
    setShowAdd(false);
  };

  const moveTask = (id: string, to: Task['column']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, column: to } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const nextCol = (col: Task['column']): Task['column'] | null => {
    if (col === 'todo') return 'progress';
    if (col === 'progress') return 'done';
    return null;
  };

  const prevCol = (col: Task['column']): Task['column'] | null => {
    if (col === 'done') return 'progress';
    if (col === 'progress') return 'todo';
    return null;
  };

  const filteredTasks = tasks
    .filter(t => filter === 'all' || t.priority === filter)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const totalDone = tasks.filter(t => t.column === 'done').length;
  const totalTasks = tasks.length;

  return (
    <GlassCard className="p-4 sm:p-6" tilt={false}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Task Board</h2>
          {totalTasks > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalDone}/{totalTasks} completed
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Filter */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-0.5 mr-1">
              {['all', 'high', 'medium', 'low'].map(f => (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium transition-all ${
                    filter === f
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
          )}
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
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <div className="glass rounded-xl p-3 space-y-2.5">
              <input
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="What needs to be done?"
                className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/40"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {PRIORITIES.map(p => (
                    <motion.button
                      key={p.key}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNewPriority(p.key)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all ${
                        newPriority === p.key ? p.class + ' border-current' : 'border-transparent text-muted-foreground/50'
                      }`}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={addTask}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                >
                  Add Task
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks yet" description="Create your first task to start organizing" actionLabel="Create Task" onAction={() => setShowAdd(true)} />
      ) : (
        <>
          {/* Progress bar */}
          {totalTasks > 0 && (
            <div className="mb-4">
              <div className="h-1 w-full rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                  animate={{ width: `${(totalDone / totalTasks) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
            {COLUMNS.map(col => {
              const colTasks = filteredTasks.filter(t => t.column === col.key);
              return (
                <div key={col.key}>
                  <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-white/[0.04]">
                    <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${col.accent}`}>{col.label}</span>
                    <span className="text-[10px] text-muted-foreground/40 ml-auto tabular-nums">{colTasks.length}</span>
                  </div>
                  <div className="space-y-1.5 min-h-[40px]">
                    <AnimatePresence>
                      {colTasks.map(task => {
                        const next = nextCol(task.column);
                        const prev = prevCol(task.column);
                        const priorityInfo = PRIORITIES.find(p => p.key === task.priority);
                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass rounded-lg p-2.5 group"
                          >
                            <div className="flex items-start gap-2">
                              {/* Click to advance */}
                              {next && (
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => moveTask(task.id, next)}
                                  className="mt-0.5 shrink-0"
                                >
                                  <col.icon className={`w-3.5 h-3.5 ${col.accent} hover:text-foreground transition-colors`} />
                                </motion.button>
                              )}
                              {task.column === 'done' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] leading-relaxed ${task.column === 'done' ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                                  {task.text}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`text-[8px] px-1 py-px rounded border font-medium ${priorityInfo?.class}`}>
                                    {priorityInfo?.label}
                                  </span>
                                </div>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {prev && (
                                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => moveTask(task.id, prev)}
                                    className="p-1 text-muted-foreground/40 hover:text-foreground">
                                    <ArrowRight className="w-3 h-3 rotate-180" />
                                  </motion.button>
                                )}
                                {next && (
                                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => moveTask(task.id, next)}
                                    className="p-1 text-muted-foreground/40 hover:text-foreground">
                                    <ArrowRight className="w-3 h-3" />
                                  </motion.button>
                                )}
                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteTask(task.id)}
                                  className="p-1 text-muted-foreground/40 hover:text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </GlassCard>
  );
};

export default TaskBoard;

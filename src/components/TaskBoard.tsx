import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, CheckCircle2, Circle, Trash2, ListTodo, ArrowRight, Clock,
  Filter, Calendar, ChevronDown, ChevronUp, Square, CheckSquare, Sparkles
} from 'lucide-react';
import { useTaskTemplates, useTasks } from '@/hooks/useCloudData';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';
import { rewardAction } from '@/lib/rewards';
import { toast } from 'sonner';

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  text: string;
  column: 'todo' | 'progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate?: string;
  subtasks: SubTask[];
}

const COLUMNS = [
  { key: 'todo' as const, label: 'To Do', icon: Circle, accent: 'text-muted-foreground', dot: 'bg-muted-foreground', gradient: 'from-muted-foreground/30 to-transparent' },
  { key: 'progress' as const, label: 'In Progress', icon: Clock, accent: 'text-primary', dot: 'bg-primary', gradient: 'from-primary/40 to-transparent' },
  { key: 'done' as const, label: 'Done', icon: CheckCircle2, accent: 'text-emerald-400', dot: 'bg-emerald-400', gradient: 'from-emerald-400/40 to-transparent' },
];

const PRIORITIES = [
  { key: 'low' as const, label: 'Low', border: 'border-l-muted-foreground/20', badge: 'border-muted-foreground/20 text-muted-foreground' },
  { key: 'medium' as const, label: 'Med', border: 'border-l-amber-500/40', badge: 'border-amber-500/30 text-amber-400' },
  { key: 'high' as const, label: 'High', border: 'border-l-red-500/40', badge: 'border-red-500/30 text-red-400' },
];

const priorityOrder = { high: 0, medium: 1, low: 2 };

const TASK_TEMPLATES: Array<{
  id: string;
  name: string;
  desc: string;
  tasks: Array<Omit<Task, 'id' | 'createdAt'>>;
}> = [
  {
    id: 'daily-reset',
    name: 'Daily Reset',
    desc: 'Quick setup for a balanced day (ADHD-friendly).',
    tasks: [
      { text: 'Pick 1 priority task (10 min)', column: 'todo', priority: 'high', subtasks: [] },
      { text: '2-minute brain dump', column: 'todo', priority: 'medium', subtasks: [] },
      { text: 'Start a 25-min focus session', column: 'todo', priority: 'medium', subtasks: [] },
      { text: 'Quick reset: water + stretch', column: 'todo', priority: 'low', subtasks: [] },
    ],
  },
  {
    id: 'study-sprint',
    name: 'Study Sprint',
    desc: 'Break a study session into tiny wins.',
    tasks: [
      {
        text: 'Define the goal (what does “done” look like?)',
        column: 'todo',
        priority: 'high',
        subtasks: [
          { id: crypto.randomUUID(), text: 'Pick topic', done: false },
          { id: crypto.randomUUID(), text: 'Pick timebox (25/45)', done: false },
        ],
      },
      { text: 'Study block 1 (Pomodoro)', column: 'todo', priority: 'medium', subtasks: [] },
      { text: 'Active recall (5 questions)', column: 'todo', priority: 'medium', subtasks: [] },
      { text: 'Submit / save progress', column: 'todo', priority: 'low', subtasks: [] },
    ],
  },
  {
    id: 'life-admin',
    name: 'Life Admin',
    desc: 'Clean up tasks you’ve been avoiding.',
    tasks: [
      { text: 'Email / messages: clear 10', column: 'todo', priority: 'medium', subtasks: [] },
      { text: 'Pay / check one bill', column: 'todo', priority: 'medium', subtasks: [] },
      { text: 'Schedule 1 appointment / reminder', column: 'todo', priority: 'low', subtasks: [] },
      { text: 'Tidy workspace (5 min)', column: 'todo', priority: 'low', subtasks: [] },
    ],
  },
];

const colStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const TaskBoard: React.FC = () => {
  const { tasks, addTask: addTaskMut, addTasks: addTasksMut, updateTask: updateTaskMut, deleteTask: deleteTaskMut } = useTasks();
  const taskTemplates = useTaskTemplates();
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | Task['priority']>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  const addTask = () => {
    if (!newText.trim()) return;
    addTaskMut.mutate({
      text: newText.trim(),
      column: 'todo',
      priority: newPriority,
      dueDate: newDueDate || undefined,
      subtasks: [],
    });
    setNewText('');
    setNewDueDate('');
    setShowAdd(false);
  };

  const moveTask = (id: string, to: Task['column']) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    updateTaskMut.mutate({ ...task, column: to });
    if (to === 'done') rewardAction('task_complete');
    else rewardAction('task_move');
  };

  const deleteTask = (id: string) => {
    deleteTaskMut.mutate(id);
  };

  const addSubtask = (taskId: string) => {
    const text = subtaskInputs[taskId]?.trim();
    if (!text) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTaskMut.mutate({
      ...task,
      subtasks: [...(task.subtasks || []), { id: crypto.randomUUID(), text, done: false }],
    });
    setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    updateTaskMut.mutate({
      ...task,
      subtasks: (task.subtasks || []).map(s => s.id === subId ? { ...s, done: !s.done } : s),
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  const safeTasks = tasks.map(t => ({ ...t, subtasks: t.subtasks || [] }));

  const filteredTasks = safeTasks
    .filter(t => filter === 'all' || t.priority === filter)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const totalDone = tasks.filter(t => t.column === 'done').length;
  const totalTasks = tasks.length;
  const today = new Date().toISOString().split('T')[0];

  const normalizeTemplateTasks = (value: unknown): Array<Omit<Task, 'id' | 'createdAt'>> => {
    if (!Array.isArray(value)) return [];

    return value
      .map((t: any) => {
        const col = t?.column;
        const column: Task['column'] = col === 'progress' || col === 'done' ? col : 'todo';

        const pr = t?.priority;
        const priority: Task['priority'] = pr === 'low' || pr === 'high' ? pr : 'medium';

        const subtasks = Array.isArray(t?.subtasks)
          ? t.subtasks
              .map((s: any) => ({
                id: typeof s?.id === 'string' ? s.id : crypto.randomUUID(),
                text: String(s?.text || '').trim(),
                done: Boolean(s?.done),
              }))
              .filter((s: SubTask) => s.text)
          : [];

        const text = String(t?.text || '').trim();
        if (!text) return null;

        return {
          text,
          column,
          priority,
          dueDate: typeof t?.dueDate === 'string' ? t.dueDate : undefined,
          subtasks,
        };
      })
      .filter(Boolean) as Array<Omit<Task, 'id' | 'createdAt'>>;
  };

  const templateItems = [
    ...TASK_TEMPLATES,
    ...taskTemplates.templates.map(t => ({
      id: `cloud-${t.id}`,
      name: t.name,
      desc: t.description || 'Custom template',
      tasks: normalizeTemplateTasks(t.tasks),
    })),
  ];

  const applyTemplate = (templateId: string) => {
    const tpl = templateItems.find(t => t.id === templateId);
    if (!tpl) return;

    addTasksMut.mutate(tpl.tasks, {
      onSuccess: () => {
        toast.success(`Template added: ${tpl.name}`);
      },
      onError: () => {
        toast.error('Could not apply template. Try again.');
      },
    });

    setShowTemplates(false);
  };

  return (
    <GlassCard className="p-4 sm:p-6" tilt={false}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Task Board</h2>
          {totalTasks > 0 && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{totalDone}/{totalTasks} completed</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 relative">
          {totalTasks > 0 && (
            <div className="flex items-center gap-0.5 mr-1">
              {['all', 'high', 'medium', 'low'].map(f => (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium transition-all ${
                    filter === f ? 'bg-primary/15 text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
          )}

          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowTemplates(v => !v)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                showTemplates ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Templates"
            >
              <Sparkles className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 glass rounded-2xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-2 z-10"
                >
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-1">Templates</p>
                  <div className="space-y-1">
                    {templateItems.map(t => (
                      <motion.button
                        key={t.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => applyTemplate(t.id)}
                        className="w-full text-left px-2 py-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                      >
                        <p className="text-xs font-semibold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowTemplates(false);
              setShowAdd(!showAdd);
            }}
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
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1">
                  {PRIORITIES.map(p => (
                    <motion.button
                      key={p.key}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNewPriority(p.key)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all ${
                        newPriority === p.key ? p.badge + ' border-current' : 'border-transparent text-muted-foreground/50'
                      }`}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="text-[10px] bg-transparent outline-none text-muted-foreground"
                  />
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={addTask}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
              >
                Add Task
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks yet" description="Create your first task to start organizing" actionLabel="Create Task" onAction={() => setShowAdd(true)} />
      ) : (
        <>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
            {COLUMNS.map(col => {
              const colTasks = filteredTasks.filter(t => t.column === col.key);
              return (
                <div key={col.key}>
                  <div className="mb-2.5 pb-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${col.accent}`}>{col.label}</span>
                      <span className="text-[10px] text-muted-foreground/40 ml-auto tabular-nums">{colTasks.length}</span>
                    </div>
                    <div className={`h-[2px] rounded-full bg-gradient-to-r ${col.gradient}`} />
                  </div>
                  <motion.div variants={colStagger} initial="hidden" animate="show" className="space-y-1.5 min-h-[40px]">
                    <AnimatePresence>
                      {colTasks.map(task => {
                        const next = nextCol(task.column);
                        const prev = prevCol(task.column);
                        const priorityInfo = PRIORITIES.find(p => p.key === task.priority);
                        const isOverdue = task.dueDate && task.dueDate < today && task.column !== 'done';
                        const isExpanded = expandedTasks.has(task.id);
                        const completedSubs = task.subtasks.filter(s => s.done).length;
                        return (
                          <motion.div
                            key={task.id}
                            variants={cardAnim}
                            layout
                            exit="exit"
                            className={`glass rounded-lg p-2.5 group border-l-2 ${priorityInfo?.border} ${
                              isOverdue ? 'shadow-[0_0_12px_rgba(239,68,68,0.15)]' : ''
                            } hover:shadow-[0_0_15px_hsl(var(--primary)_/_0.10)] transition-shadow`}
                          >
                            <div className="flex items-start gap-2">
                              {next && (
                                <motion.button whileTap={{ scale: 0.8 }} onClick={() => moveTask(task.id, next)} className="mt-0.5 shrink-0">
                                  <col.icon className={`w-3.5 h-3.5 ${col.accent} hover:text-foreground transition-colors`} />
                                </motion.button>
                              )}
                              {task.column === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] leading-relaxed ${task.column === 'done' ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                                  {task.text}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className={`text-[8px] px-1 py-px rounded border font-medium ${priorityInfo?.badge}`}>
                                    {priorityInfo?.label}
                                  </span>
                                  {task.dueDate && (
                                    <span className={`text-[8px] px-1 py-px rounded flex items-center gap-0.5 ${
                                      isOverdue ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground/60'
                                    }`}>
                                      <Calendar className="w-2 h-2" />
                                      {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                  {task.subtasks.length > 0 && (
                                    <button
                                      onClick={() => toggleExpand(task.id)}
                                      className="text-[8px] text-muted-foreground/60 flex items-center gap-0.5 hover:text-foreground transition-colors"
                                    >
                                      {completedSubs}/{task.subtasks.length} subtasks
                                      {isExpanded ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                                    </button>
                                  )}
                                </div>

                                <AnimatePresence>
                                  {(isExpanded || task.subtasks.length === 0) && (task.column === 'todo' || task.column === 'progress') && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      {task.subtasks.length > 0 && (
                                        <div className="mt-2 space-y-1 pl-0.5">
                                          {task.subtasks.map(sub => (
                                            <motion.button
                                              key={sub.id}
                                              layout
                                              onClick={() => toggleSubtask(task.id, sub.id)}
                                              className="flex items-center gap-1.5 w-full text-left"
                                            >
                                              {sub.done
                                                ? <CheckSquare className="w-3 h-3 text-primary shrink-0" />
                                                : <Square className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                                              }
                                              <span className={`text-[10px] ${sub.done ? 'line-through text-muted-foreground/40' : 'text-muted-foreground'}`}>
                                                {sub.text}
                                              </span>
                                            </motion.button>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1 mt-1.5">
                                        <input
                                          value={subtaskInputs[task.id] || ''}
                                          onChange={e => setSubtaskInputs(p => ({ ...p, [task.id]: e.target.value }))}
                                          onKeyDown={e => e.key === 'Enter' && addSubtask(task.id)}
                                          placeholder="+ subtask"
                                          className="flex-1 text-[10px] bg-transparent outline-none text-muted-foreground placeholder:text-muted-foreground/30"
                                        />
                                        {subtaskInputs[task.id]?.trim() && (
                                          <motion.button
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => addSubtask(task.id)}
                                            className="text-primary"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </motion.button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {!isExpanded && task.subtasks.length === 0 && (task.column === 'todo' || task.column === 'progress') && (
                                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleExpand(task.id)}
                                    className="p-1 text-muted-foreground/40 hover:text-primary" title="Add subtasks">
                                    <Plus className="w-3 h-3" />
                                  </motion.button>
                                )}
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
                  </motion.div>
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical, CheckCircle2, Circle, Trash2, ListTodo } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface Task {
  id: string;
  text: string;
  column: 'todo' | 'progress' | 'done';
  createdAt: string;
}

const COLUMNS = [
  { key: 'todo' as const, label: 'To Do', icon: Circle },
  { key: 'progress' as const, label: 'In Progress', icon: GripVertical },
  { key: 'done' as const, label: 'Done', icon: CheckCircle2 },
];

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useLocalStorage<Task[]>('nexus-tasks', []);
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const addTask = () => {
    if (!newText.trim()) return;
    setTasks(prev => [...prev, {
      id: crypto.randomUUID(),
      text: newText.trim(),
      column: 'todo',
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

  return (
    <GlassCard className="p-6" tilt={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Task Board</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdd(!showAdd)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
            <div className="glass rounded-xl p-3 flex gap-2">
              <input
                value={newText}
                onChange={e => setNewText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="New task..."
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
              />
              <motion.button whileTap={{ scale: 0.9 }} onClick={addTask} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Add</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks" description="Add your first task to get started" actionLabel="Add Task" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {COLUMNS.map(col => (
            <div key={col.key}>
              <div className="flex items-center gap-1.5 mb-2">
                <col.icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</span>
                <span className="text-[9px] text-muted-foreground/60 ml-auto">{tasks.filter(t => t.column === col.key).length}</span>
              </div>
              <div className="space-y-1.5 min-h-[60px]">
                <AnimatePresence>
                  {tasks.filter(t => t.column === col.key).map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="glass rounded-lg p-2 group cursor-pointer"
                      onClick={() => { const n = nextCol(task.column); if (n) moveTask(task.id, n); }}
                    >
                      <p className={`text-[11px] leading-relaxed ${task.column === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.text}
                      </p>
                      <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }}>
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default TaskBoard;

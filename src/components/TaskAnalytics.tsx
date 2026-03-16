import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';
import { CheckCircle2, ListTodo, TrendingUp, Calendar } from 'lucide-react';
import { useTasks } from '@/hooks/useCloudData';
import GlassCard from './GlassCard';

const TaskAnalytics: React.FC = () => {
  const { tasks } = useTasks();

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.createdAt.startsWith(today));
  const todayCompleted = todayTasks.filter(t => t.column === 'done').length;
  const totalCompleted = tasks.filter(t => t.column === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;

  // Last 7 days data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const done = tasks.filter(t => t.column === 'done' && t.createdAt.startsWith(key)).length;
    return { day: d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2), done };
  });

  const stats = [
    { label: 'Today Done', value: todayCompleted, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Total Tasks', value: tasks.length, icon: ListTodo, color: 'text-primary' },
    { label: 'Completion', value: `${completionRate}%`, icon: TrendingUp, color: 'text-amber-400' },
    { label: 'Created Today', value: todayTasks.length, icon: Calendar, color: 'text-purple-400' },
  ];

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Task Analytics</h3>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-3 text-center"
          >
            <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Mini chart */}
      <div className="h-20">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last7}>
            <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Bar dataKey="done" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-muted-foreground text-center mt-1">Tasks completed (last 7 days)</p>
    </GlassCard>
  );
};

export default TaskAnalytics;

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Timer, ListTodo, Target, PenLine, Smile, Moon, BookOpen, Droplets, BarChart3, Zap, ArrowRight, Settings, Bell } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import DailyQuotes from '@/components/DailyQuotes';
import ReminderManager from '@/components/ReminderManager';
import { useInAppReminders, useScheduledReminders, requestNotificationPermission } from '@/hooks/useReminders';
import { useEffect } from 'react';

const modules = [
  { to: '/flow', label: 'Flow Engine', desc: 'Pomodoro timer with ambient sounds', icon: Timer, color: 'from-blue-500/20 to-indigo-500/20' },
  { to: '/tasks', label: 'Task Board', desc: 'Kanban-style task management', icon: ListTodo, color: 'from-emerald-500/20 to-teal-500/20' },
  { to: '/habits', label: 'Habit Tracker', desc: 'Build and track daily habits', icon: Target, color: 'from-orange-500/20 to-amber-500/20' },
  { to: '/journal', label: 'Brain Dump', desc: 'Journaling & Feynman technique', icon: PenLine, color: 'from-purple-500/20 to-fuchsia-500/20' },
  { to: '/mood', label: 'Mood Logger', desc: 'Track your emotional patterns', icon: Smile, color: 'from-pink-500/20 to-rose-500/20' },
  { to: '/sleep', label: 'Sleep Tracker', desc: 'Monitor sleep quality & patterns', icon: Moon, color: 'from-indigo-500/20 to-violet-500/20' },
  { to: '/notes', label: 'Notes', desc: 'Markdown notes with categories', icon: BookOpen, color: 'from-cyan-500/20 to-sky-500/20' },
  { to: '/water', label: 'Hydration', desc: 'Daily water intake tracking', icon: Droplets, color: 'from-sky-500/20 to-blue-500/20' },
  { to: '/stats', label: 'Pomodoro Stats', desc: 'Focus time analytics & trends', icon: BarChart3, color: 'from-red-500/20 to-orange-500/20' },
  { to: '/settings', label: 'Settings', desc: 'Video bg, accent colors, preferences', icon: Settings, color: 'from-gray-500/20 to-zinc-500/20' },
];

const Index = () => {
  useInAppReminders(true);
  useScheduledReminders();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <PageLayout>
      {/* Hero */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="inline-flex items-center gap-2 mb-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 flex items-center justify-center glow-primary">
            <Zap className="w-6 h-6 text-primary" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-foreground mb-2"
        >
          Nexus <span className="shimmer-text">Elite</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground max-w-md mx-auto"
        >
          Your personal productivity command center
        </motion.p>
      </div>

      {/* Module Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
      >
        {modules.map(mod => (
          <motion.div key={mod.to} variants={staggerItem}>
            <Link to={mod.to}>
              <GlassCard className="p-5 group transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-3`}>
                    <mod.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{mod.label}</h3>
                <p className="text-xs text-muted-foreground">{mod.desc}</p>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Reminders */}
      <motion.div variants={staggerItem} initial="hidden" animate="show" className="mb-6">
        <ReminderManager />
      </motion.div>

      {/* Daily Quote */}
      <motion.div variants={staggerItem} initial="hidden" animate="show">
        <DailyQuotes />
      </motion.div>
    </PageLayout>
  );
};

export default Index;

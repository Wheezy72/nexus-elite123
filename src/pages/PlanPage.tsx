import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ListTodo, Timer, GraduationCap, ArrowRight } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';

const planItems = [
  { to: '/tasks', label: 'Tasks', desc: 'Pick today’s priorities and execute.', icon: ListTodo, color: 'from-emerald-500/20 to-teal-500/20' },
  { to: '/flow', label: 'Flow', desc: 'Pomodoro focus with ambience.', icon: Timer, color: 'from-blue-500/20 to-indigo-500/20' },
  { to: '/study', label: 'Study', desc: 'Plan sessions and stay consistent.', icon: GraduationCap, color: 'from-violet-500/20 to-purple-500/20' },
];

const PlanPage = () => {
  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl font-bold text-foreground">Plan</h1>
          <p className="text-xs text-muted-foreground mt-1">Choose what matters today, then focus.</p>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {planItems.map(item => (
            <Link key={item.to} to={item.to}>
              <GlassCard className="p-5 group" tilt={false}>
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                    <item.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </GlassCard>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default PlanPage;

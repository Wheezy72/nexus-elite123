import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Settings, DollarSign, ArrowRight } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';

const youItems = [
  { to: '/profile', label: 'Profile', desc: 'Avatar, encrypted photo, identity.', icon: User, color: 'from-primary/20 to-accent/20' },
  { to: '/finance', label: 'Finance', desc: 'Budgets, limits, categories, imports.', icon: DollarSign, color: 'from-emerald-500/20 to-teal-500/20' },
  { to: '/settings', label: 'Settings', desc: 'App lock, backups, theme, notifications.', icon: Settings, color: 'from-gray-500/20 to-zinc-500/20' },
];

const YouPage = () => {
  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl font-bold text-foreground">You</h1>
          <p className="text-xs text-muted-foreground mt-1">Account, privacy, and life admin.</p>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {youItems.map(item => (
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

export default YouPage;

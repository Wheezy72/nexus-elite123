import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, BarChart3, Trophy, ArrowRight } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import WeeklyReviewCard from '@/components/WeeklyReviewCard';

const insightItems = [
  { to: '/analytics', label: 'Analytics', desc: 'Wellness trends, correlations, patterns.', icon: Activity, color: 'from-cyan-500/20 to-sky-500/20' },
  { to: '/stats', label: 'Focus Stats', desc: 'Pomodoro and focus time trends.', icon: BarChart3, color: 'from-red-500/20 to-orange-500/20' },
  { to: '/achievements', label: 'Achievements', desc: 'Levels, XP, and trophy cabinet.', icon: Trophy, color: 'from-yellow-500/20 to-amber-500/20' },
];

const InsightsPage = () => {
  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          <p className="text-xs text-muted-foreground mt-1">Trends and correlations live here.</p>
        </motion.div>

        <motion.div variants={staggerItem}>
          <WeeklyReviewCard compact />
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insightItems.map(item => (
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

export default InsightsPage;

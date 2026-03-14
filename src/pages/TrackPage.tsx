import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Target, Smile, Moon, Droplets, PenLine, BookOpen, ArrowRight } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';

const trackItems = [
  { to: '/habits', label: 'Habits', desc: 'Build small wins that compound.', icon: Target, color: 'from-orange-500/20 to-amber-500/20' },
  { to: '/mood', label: 'Mood', desc: 'One-tap check-ins with optional details.', icon: Smile, color: 'from-pink-500/20 to-rose-500/20' },
  { to: '/sleep', label: 'Sleep', desc: 'Track quality and consistency.', icon: Moon, color: 'from-indigo-500/20 to-violet-500/20' },
  { to: '/water', label: 'Water', desc: 'Hydration streaks and daily goal.', icon: Droplets, color: 'from-sky-500/20 to-blue-500/20' },
  { to: '/journal', label: 'Journal', desc: 'Brain dump and reflection.', icon: PenLine, color: 'from-purple-500/20 to-fuchsia-500/20' },
  { to: '/notes', label: 'Notes', desc: 'Keep ideas organized and searchable.', icon: BookOpen, color: 'from-cyan-500/20 to-sky-500/20' },
];

const TrackPage = () => {
  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
        <motion.div variants={staggerItem}>
          <h1 className="text-2xl font-bold text-foreground">Track</h1>
          <p className="text-xs text-muted-foreground mt-1">Quick logs now, insights later.</p>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {trackItems.map(item => (
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

        <motion.div variants={staggerItem}>
          <Link to="/analytics" className="block">
            <GlassCard className="p-5" tilt={false}>
              <p className="text-xs text-muted-foreground">Want the bigger picture?</p>
              <div className="flex items-center justify-between gap-3 mt-1">
                <p className="text-sm font-semibold text-foreground">See your patterns & correlations</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </GlassCard>
          </Link>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default TrackPage;

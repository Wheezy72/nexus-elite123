import { motion } from 'framer-motion';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import HabitTracker from '@/components/HabitTracker';
import GoalTracker from '@/components/GoalTracker';
import HabitInsights from '@/components/HabitInsights';
import XPBar from '@/components/XPBar';

const HabitsPage = () => (
  <PageLayout>
    <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Habits & Goals</motion.h1>
    <XPBar />
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div variants={staggerItem} className="lg:col-span-2 space-y-4">
        <HabitTracker />
        <GoalTracker />
      </motion.div>
      <motion.div variants={staggerItem}>
        <HabitInsights />
      </motion.div>
    </motion.div>
  </PageLayout>
);

export default HabitsPage;

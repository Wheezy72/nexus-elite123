import { motion } from 'framer-motion';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import TaskBoard from '@/components/TaskBoard';
import TaskAnalytics from '@/components/TaskAnalytics';
import DailyPlanner from '@/components/DailyPlanner';
import XPBar from '@/components/XPBar';

const TasksPage = () => (
  <PageLayout>
    <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Task Board</motion.h1>
    <XPBar />
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div variants={staggerItem} className="lg:col-span-2">
        <TaskBoard />
      </motion.div>
      <motion.div variants={staggerItem} className="space-y-4">
        <TaskAnalytics />
        <DailyPlanner />
      </motion.div>
    </motion.div>
  </PageLayout>
);

export default TasksPage;

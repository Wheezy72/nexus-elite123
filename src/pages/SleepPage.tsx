import { motion } from 'framer-motion';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import SleepTracker from '@/components/SleepTracker';
import SleepTips from '@/components/SleepTips';
import SleepDebt from '@/components/SleepDebt';

const SleepPage = () => (
  <PageLayout>
    <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Sleep Tracker</motion.h1>
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div variants={staggerItem} className="lg:col-span-2">
        <SleepTracker />
      </motion.div>
      <motion.div variants={staggerItem} className="space-y-4">
        <SleepDebt />
        <SleepTips />
      </motion.div>
    </motion.div>
  </PageLayout>
);

export default SleepPage;

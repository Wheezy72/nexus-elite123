import { motion } from 'framer-motion';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import BrainDump from '@/components/BrainDump';
import FeynmanCard from '@/components/FeynmanCard';
import JournalExtras from '@/components/JournalExtras';
import JournalStats from '@/components/JournalStats';
import MoodTimeline from '@/components/MoodTimeline';
import XPBar from '@/components/XPBar';

const JournalPage = () => (
  <PageLayout>
    <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Journal</motion.h1>
    <XPBar />
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div variants={staggerItem} className="lg:col-span-2 space-y-4">
        <BrainDump />
        <FeynmanCard />
      </motion.div>
      <motion.div variants={staggerItem} className="space-y-4">
        <JournalStats />
        <MoodTimeline />
        <JournalExtras />
      </motion.div>
    </motion.div>
  </PageLayout>
);

export default JournalPage;

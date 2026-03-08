import PageLayout from '@/components/PageLayout';
import SleepTracker from '@/components/SleepTracker';

const SleepPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Sleep Tracker</h1>
    <SleepTracker />
  </PageLayout>
);

export default SleepPage;

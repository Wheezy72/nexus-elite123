import PageLayout from '@/components/PageLayout';
import SleepTracker from '@/components/SleepTracker';
import SleepTips from '@/components/SleepTips';
import SleepDebt from '@/components/SleepDebt';

const SleepPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Sleep Tracker</h1>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <SleepTracker />
      </div>
      <div className="space-y-4">
        <SleepDebt />
        <SleepTips />
      </div>
    </div>
  </PageLayout>
);

export default SleepPage;

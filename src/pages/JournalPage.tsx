import PageLayout from '@/components/PageLayout';
import BrainDump from '@/components/BrainDump';
import FeynmanCard from '@/components/FeynmanCard';
import JournalExtras from '@/components/JournalExtras';
import XPBar from '@/components/XPBar';

const JournalPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Journal</h1>
    <XPBar />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <BrainDump />
        <FeynmanCard />
      </div>
      <JournalExtras />
    </div>
  </PageLayout>
);

export default JournalPage;

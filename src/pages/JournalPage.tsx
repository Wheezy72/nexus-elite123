import PageLayout from '@/components/PageLayout';
import BrainDump from '@/components/BrainDump';
import FeynmanCard from '@/components/FeynmanCard';

const JournalPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Journal</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BrainDump />
      <FeynmanCard />
    </div>
  </PageLayout>
);

export default JournalPage;

import PageLayout from '@/components/PageLayout';
import HabitTracker from '@/components/HabitTracker';
import GoalTracker from '@/components/GoalTracker';
import HabitInsights from '@/components/HabitInsights';
import XPBar from '@/components/XPBar';

const HabitsPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Habits & Goals</h1>
    <XPBar />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <HabitTracker />
        <GoalTracker />
      </div>
      <HabitInsights />
    </div>
  </PageLayout>
);

export default HabitsPage;

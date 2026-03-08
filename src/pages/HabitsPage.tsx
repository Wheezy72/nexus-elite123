import PageLayout from '@/components/PageLayout';
import HabitTracker from '@/components/HabitTracker';
import GoalTracker from '@/components/GoalTracker';
import XPBar from '@/components/XPBar';

const HabitsPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Habits & Goals</h1>
    <XPBar />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HabitTracker />
      <GoalTracker />
    </div>
  </PageLayout>
);

export default HabitsPage;

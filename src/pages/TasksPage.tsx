import PageLayout from '@/components/PageLayout';
import TaskBoard from '@/components/TaskBoard';
import TaskAnalytics from '@/components/TaskAnalytics';
import DailyPlanner from '@/components/DailyPlanner';
import XPBar from '@/components/XPBar';

const TasksPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Task Board</h1>
    <XPBar />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <TaskBoard />
      </div>
      <div className="space-y-4">
        <TaskAnalytics />
        <DailyPlanner />
      </div>
    </div>
  </PageLayout>
);

export default TasksPage;

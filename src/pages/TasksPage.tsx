import PageLayout from '@/components/PageLayout';
import TaskBoard from '@/components/TaskBoard';
import XPBar from '@/components/XPBar';

const TasksPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Task Board</h1>
    <XPBar />
    <TaskBoard />
  </PageLayout>
);

export default TasksPage;

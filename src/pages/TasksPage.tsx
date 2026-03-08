import PageLayout from '@/components/PageLayout';
import TaskBoard from '@/components/TaskBoard';

const TasksPage = () => (
  <PageLayout>
    <h1 className="text-2xl font-bold text-foreground mb-6">Task Board</h1>
    <TaskBoard />
  </PageLayout>
);

export default TasksPage;

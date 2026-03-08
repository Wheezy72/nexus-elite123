import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { rewardAction } from '@/lib/rewards';

// ==================== TASKS ====================
interface Task {
  id: string;
  text: string;
  column: 'todo' | 'progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate?: string;
  subtasks: { id: string; text: string; done: boolean }[];
}

export function useTasks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id,
        text: t.text,
        column: t.column_status as Task['column'],
        priority: t.priority as Task['priority'],
        createdAt: t.created_at,
        dueDate: t.due_date || undefined,
        subtasks: (t.subtasks as any[]) || [],
      }));
    },
    enabled: !!user,
  });

  const setTasks = (updater: Task[] | ((prev: Task[]) => Task[])) => {
    qc.setQueryData(['tasks', user?.id], (old: Task[] = []) =>
      typeof updater === 'function' ? updater(old) : updater
    );
  };

  const addTask = useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'createdAt'>) => {
      if (!user) return;
      const { error } = await supabase.from('tasks').insert({
        user_id: user.id,
        text: task.text,
        column_status: task.column,
        priority: task.priority,
        due_date: task.dueDate || null,
        subtasks: task.subtasks,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); rewardAction('task_create'); },
  });

  const updateTask = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase.from('tasks').update({
        text: task.text,
        column_status: task.column,
        priority: task.priority,
        due_date: task.dueDate || null,
        subtasks: task.subtasks as any,
      }).eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return { tasks, isLoading, setTasks, addTask, updateTask, deleteTask };
}

// ==================== HABITS ====================
interface Habit {
  id: string;
  name: string;
  emoji: string;
}

export function useHabits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('habits').select('*').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(h => ({ id: h.id, name: h.name, emoji: h.emoji }));
    },
    enabled: !!user,
  });

  const { data: logs = {} } = useQuery({
    queryKey: ['habit-logs', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase.from('habit_logs').select('*').eq('user_id', user.id);
      if (error) throw error;
      const logMap: Record<string, string[]> = {};
      (data || []).forEach(l => {
        if (!logMap[l.date]) logMap[l.date] = [];
        logMap[l.date].push(l.habit_id);
      });
      return logMap;
    },
    enabled: !!user,
  });

  const addHabit = useMutation({
    mutationFn: async (habit: { name: string; emoji: string }) => {
      if (!user) return;
      const { error } = await supabase.from('habits').insert({ user_id: user.id, name: habit.name, emoji: habit.emoji });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const removeHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });

  const toggleLog = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!user) return;
      const existing = logs[date]?.includes(habitId);
      if (existing) {
        await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', date).eq('user_id', user.id);
      } else {
        const { error } = await supabase.from('habit_logs').insert({ user_id: user.id, habit_id: habitId, date });
        if (error) throw error;
        rewardAction('habit_check');
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habit-logs'] }),
  });

  return { habits, logs, isLoading, addHabit, removeHabit, toggleLog };
}

// ==================== JOURNAL ====================
interface JournalEntry {
  id: string;
  text: string;
  mood: number | null;
  timestamp: string;
  tags: string[];
}

export function useJournal() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(e => ({ id: e.id, text: e.text, mood: e.mood, timestamp: e.created_at, tags: e.tags || [] }));
    },
    enabled: !!user,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: { text: string; mood: number | null; tags: string[] }) => {
      if (!user) return;
      const { error } = await supabase.from('journal_entries').insert({ user_id: user.id, text: entry.text, mood: entry.mood, tags: entry.tags });
      if (error) throw error;
      rewardAction('journal_entry');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  });

  return { entries, isLoading, addEntry, deleteEntry };
}

// ==================== MOOD ====================
interface MoodEntry {
  id: string;
  emoji: string;
  label: string;
  note: string;
  date: string;
  triggers?: string[];
}

export function useMood() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['mood', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('mood_entries').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map(e => ({ id: e.id, emoji: e.emoji, label: e.label, note: e.note || '', date: e.date, triggers: e.triggers || [] }));
    },
    enabled: !!user,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: Omit<MoodEntry, 'id'>) => {
      if (!user) return;
      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id, emoji: entry.emoji, label: entry.label, note: entry.note, triggers: entry.triggers || [],
      });
      if (error) throw error;
      rewardAction('mood_log');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mood'] }),
  });

  return { entries, isLoading, addEntry };
}

// ==================== SLEEP ====================
interface SleepEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  hoursSlept: number;
}

export function useSleep() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['sleep', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('sleep_entries').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map(e => ({
        id: e.id, date: e.date, bedtime: e.bedtime, wakeTime: e.wake_time, quality: e.quality, hoursSlept: Number(e.hours_slept),
      }));
    },
    enabled: !!user,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: Omit<SleepEntry, 'id'>) => {
      if (!user) return;
      const { error } = await supabase.from('sleep_entries').insert({
        user_id: user.id, date: entry.date, bedtime: entry.bedtime, wake_time: entry.wakeTime, quality: entry.quality, hours_slept: entry.hoursSlept,
      });
      if (error) throw error;
      rewardAction('sleep_log');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sleep'] }),
  });

  return { entries, isLoading, addEntry };
}

// ==================== WATER ====================
export function useWater() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const todayKey = new Date().toISOString().split('T')[0];

  const { data: waterData = { log: {} as Record<string, number>, goal: 8 }, isLoading } = useQuery({
    queryKey: ['water', user?.id],
    queryFn: async () => {
      if (!user) return { log: {} as Record<string, number>, goal: 8 };
      const { data, error } = await supabase.from('water_logs').select('*').eq('user_id', user.id);
      if (error) throw error;
      const log: Record<string, number> = {};
      let goal = 8;
      (data || []).forEach(w => {
        log[w.date] = w.glasses;
        if (w.date === todayKey) goal = w.goal;
      });
      return { log, goal };
    },
    enabled: !!user,
  });

  const upsertWater = useMutation({
    mutationFn: async ({ date, glasses, goal }: { date: string; glasses: number; goal: number }) => {
      if (!user) return;
      const { error } = await supabase.from('water_logs').upsert(
        { user_id: user.id, date, glasses, goal },
        { onConflict: 'user_id,date' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['water'] }),
  });

  return { log: waterData.log, goal: waterData.goal, isLoading, upsertWater, todayKey };
}

// ==================== NOTES ====================
interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function useNotes() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(n => ({
        id: n.id, title: n.title, content: n.content || '', category: n.category, createdAt: n.created_at, updatedAt: n.updated_at,
      }));
    },
    enabled: !!user,
  });

  const addNote = useMutation({
    mutationFn: async (note: { title: string; content: string; category: string }) => {
      if (!user) return;
      const { data, error } = await supabase.from('notes').insert({ user_id: user.id, ...note }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; content?: string; category?: string }) => {
      const { error } = await supabase.from('notes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  return { notes, isLoading, addNote, updateNote, deleteNote };
}

// ==================== GOALS ====================
interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  period: 'daily' | 'weekly';
  createdAt: string;
}

export function useGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('goals').select('*').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(g => ({
        id: g.id, name: g.name, target: g.target, current: g.current, unit: g.unit, period: g.period as Goal['period'], createdAt: g.created_at,
      }));
    },
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: { name: string; target: number; unit: string; period: string }) => {
      if (!user) return;
      const { error } = await supabase.from('goals').insert({ user_id: user.id, ...goal });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: number }) => {
      const { error } = await supabase.from('goals').update({ current }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  return { goals, isLoading, addGoal, updateGoal, deleteGoal };
}

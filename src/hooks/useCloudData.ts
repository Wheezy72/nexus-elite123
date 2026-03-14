import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { rewardAction } from '@/lib/rewards';
import { financeOfflineService } from '@/services/financeOfflineService';

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
        user_id: user.id,
        emoji: entry.emoji,
        label: entry.label,
        note: entry.note,
        triggers: entry.triggers || [],
      });
      if (error) throw error;
      rewardAction('mood_log');
    },
    // Optimistic UI update so the timeline/chart updates immediately.
    onMutate: async (entry) => {
      if (!user) return;
      const key = ['mood', user.id] as const;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<MoodEntry[]>(key);

      const optimistic: MoodEntry = {
        id: `optimistic-${Date.now()}`,
        emoji: entry.emoji,
        label: entry.label,
        note: entry.note,
        date: entry.date,
        triggers: entry.triggers || [],
      };

      qc.setQueryData<MoodEntry[]>(key, (old = []) => [optimistic, ...old]);
      return { previous, key };
    },
    onError: (_err, _entry, ctx) => {
      if (!ctx) return;
      qc.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => {
      if (!user) return;
      qc.invalidateQueries({ queryKey: ['mood', user.id] });
    },
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
        { onConflict: 'user_id,date' },
      );
      if (error) throw error;
    },
    // Optimistic UI update so the count changes immediately.
    onMutate: async (vars) => {
      if (!user) return;
      const key = ['water', user.id] as const;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<{ log: Record<string, number>; goal: number }>(key);

      qc.setQueryData<{ log: Record<string, number>; goal: number }>(key, (old) => {
        const base = old ?? { log: {}, goal: vars.goal };
        return {
          log: { ...base.log, [vars.date]: vars.glasses },
          // store the latest goal for "today" (and keep prior goal otherwise)
          goal: vars.date === todayKey ? vars.goal : base.goal,
        };
      });

      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(ctx.key, ctx.previous);
    },
    onSettled: () => {
      if (!user) return;
      qc.invalidateQueries({ queryKey: ['water', user.id] });
    },
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

// ==================== FINANCE ====================

export interface FinanceTransaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
  pending?: boolean;
}

export interface FinanceBudget {
  month: string; // YYYY-MM-01
  budget: number;
  pending?: boolean;
}

export interface FinanceCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface FinanceSavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  targetDate?: string;
  createdAt: string;
}

export interface FinanceLimit {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  limit: number;
  category?: string | null;
  warnAtPercent: number;
}

function financeCategoriesCacheKey(userId: string) {
  return `nexus-finance-categories-v1:${userId}`;
}

export function useFinanceCategories() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['finance-categories', user?.id],
    queryFn: async () => {
      if (!user) return [];

      if (!navigator.onLine) {
        const raw = localStorage.getItem(financeCategoriesCacheKey(user.id));
        if (!raw) return [];
        try {
          return JSON.parse(raw) as FinanceCategory[];
        } catch {
          return [];
        }
      }

      const { data, error } = await supabase
        .from('finance_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const mapped = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        color: c.color,
        createdAt: c.created_at,
      }));

      localStorage.setItem(financeCategoriesCacheKey(user.id), JSON.stringify(mapped));
      return mapped;
    },
    enabled: !!user,
  });

  const addCategory = useMutation({
    mutationFn: async (cat: { name: string; color: string }) => {
      if (!user) return;
      const { error } = await supabase.from('finance_categories').insert({ user_id: user.id, name: cat.name, color: cat.color });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-categories'] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-categories'] }),
  });

  return { categories, isLoading, addCategory, deleteCategory };
}

export function useFinanceSavingsGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['finance-savings-goals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('finance_savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(g => ({
        id: g.id,
        name: g.name,
        target: Number(g.target),
        current: Number(g.current),
        targetDate: g.target_date || undefined,
        createdAt: g.created_at,
      }));
    },
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: async (goal: { name: string; target: number; targetDate?: string }) => {
      if (!user) return;
      const { error } = await supabase.from('finance_savings_goals').insert({
        user_id: user.id,
        name: goal.name,
        target: goal.target,
        target_date: goal.targetDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-savings-goals'] }),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: number }) => {
      const { error } = await supabase.from('finance_savings_goals').update({ current }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-savings-goals'] }),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_savings_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-savings-goals'] }),
  });

  return { goals, isLoading, addGoal, updateGoal, deleteGoal };
}

export function useFinanceLimits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: limits = [], isLoading } = useQuery({
    queryKey: ['finance-limits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('finance_limits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(l => ({
        id: l.id,
        period: l.period as FinanceLimit['period'],
        limit: Number(l.limit_amount),
        category: l.category,
        warnAtPercent: Number(l.warn_at_percent),
      }));
    },
    enabled: !!user,
  });

  const upsertLimit = useMutation({
    mutationFn: async (limit: { period: FinanceLimit['period']; limit: number; category?: string | null; warnAtPercent: number }) => {
      if (!user) return;
      const { error } = await supabase.from('finance_limits').upsert(
        {
          user_id: user.id,
          period: limit.period,
          limit_amount: limit.limit,
          category: limit.category || null,
          warn_at_percent: limit.warnAtPercent,
        },
        { onConflict: 'user_id,period,category' }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-limits'] }),
  });

  const deleteLimit = useMutation({
    mutationFn: async ({ period, category }: { period: FinanceLimit['period']; category?: string | null }) => {
      if (!user) return;
      let q = supabase.from('finance_limits').delete().eq('user_id', user.id).eq('period', period);
      if (category) q = q.eq('category', category);
      else q = q.is('category', null);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-limits'] }),
  });

  return { limits, isLoading, upsertLimit, deleteLimit };
}

export function useFinance(monthKey: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['finance-transactions', user?.id, monthKey],
    queryFn: async () => {
      if (!user) return [];

      if (navigator.onLine) {
        await financeOfflineService.syncMonth(user.id, monthKey, supabase);
      }

      if (!navigator.onLine) {
        const cache = financeOfflineService.getMonthSnapshot(user.id, monthKey);
        return cache.snapshot;
      }

      const monthStart = `${monthKey}-01`;
      const [y, m] = monthKey.split('-').map(Number);
      const monthEnd = new Date(y, m, 0);
      const monthEndKey = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEndKey)
        .order('date', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(t => ({
        id: t.id,
        date: t.date,
        amount: Number(t.amount),
        category: t.category,
        note: t.note || '',
        pending: false,
      }));

      const cache = financeOfflineService.getMonthSnapshot(user.id, monthKey);
      financeOfflineService.setMonthSnapshot(user.id, monthKey, {
        ...cache,
        snapshot: mapped,
      });

      return mapped;
    },
    enabled: !!user,
  });

  const { data: budget = null } = useQuery({
    queryKey: ['finance-budget', user?.id, monthKey],
    queryFn: async () => {
      if (!user) return null;

      const month = `${monthKey}-01`;
      const cache = financeOfflineService.getMonthSnapshot(user.id, monthKey);

      if (!navigator.onLine) {
        if (cache.budget == null) return null;
        return { month, budget: cache.budget, pending: !!cache.budgetPending } as FinanceBudget;
      }

      await financeOfflineService.syncMonth(user.id, monthKey, supabase);

      const { data, error } = await supabase
        .from('finance_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        financeOfflineService.setMonthSnapshot(user.id, monthKey, { ...cache, budget: null, budgetPending: false });
        return null;
      }

      const mapped = { month: data.month, budget: Number(data.budget), pending: false } as FinanceBudget;
      financeOfflineService.setMonthSnapshot(user.id, monthKey, { ...cache, budget: mapped.budget, budgetPending: false });
      return mapped;
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (t: { id?: string; date: string; amount: number; category: string; note: string }) => {
      if (!user) return;
      const id = t.id || crypto.randomUUID();
      const payload = { id, date: t.date, amount: t.amount, category: t.category, note: t.note || '' };

      if (!navigator.onLine) {
        financeOfflineService.addLocalTransaction(user.id, monthKey, payload);
        qc.setQueryData(['finance-transactions', user.id, monthKey], (old: FinanceTransaction[] = []) => [
          { ...payload, pending: true },
          ...old,
        ]);
        rewardAction('finance_review');
        return;
      }

      await financeOfflineService.syncMonth(user.id, monthKey, supabase);
      const { error } = await supabase.from('finance_transactions').insert({ user_id: user.id, ...payload });
      if (error) throw error;
      rewardAction('finance_review');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-transactions'] }),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;

      if (!navigator.onLine) {
        financeOfflineService.deleteLocalTransaction(user.id, monthKey, id);
        qc.setQueryData(['finance-transactions', user.id, monthKey], (old: FinanceTransaction[] = []) => old.filter(t => t.id !== id));
        return;
      }

      await financeOfflineService.syncMonth(user.id, monthKey, supabase);
      const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-transactions'] }),
  });

  const setBudget = useMutation({
    mutationFn: async (budgetValue: number) => {
      if (!user) return;
      const month = `${monthKey}-01`;

      if (!navigator.onLine) {
        financeOfflineService.setLocalBudget(user.id, monthKey, month, budgetValue);
        qc.setQueryData(['finance-budget', user.id, monthKey], { month, budget: budgetValue, pending: true } as FinanceBudget);
        return;
      }

      await financeOfflineService.syncMonth(user.id, monthKey, supabase);
      const { error } = await supabase.from('finance_budgets').upsert(
        { user_id: user.id, month, budget: budgetValue },
        { onConflict: 'user_id,month' }
      );
      if (error) throw error;

      financeOfflineService.markBudgetSynced(user.id, monthKey);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance-budget'] }),
  });

  const syncNow = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (!navigator.onLine) return;
      await financeOfflineService.syncMonth(user.id, monthKey, supabase);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-transactions'] });
      qc.invalidateQueries({ queryKey: ['finance-budget'] });
    },
  });

  return { transactions, budget, isLoading, addTransaction, deleteTransaction, setBudget, syncNow };
}

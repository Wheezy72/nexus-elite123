import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, X, Clock, Repeat, Trash2, Check, BellRing } from 'lucide-react';
import GlassCard from './GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { requestNotificationPermission } from '@/hooks/useReminders';

const ReminderManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('remind_at', { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user || !title.trim() || !remindAt) return;
      const { error } = await supabase.from('reminders').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        remind_at: new Date(remindAt).toISOString(),
        repeat,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setTitle(''); setDescription(''); setRemindAt(''); setRepeat('none'); setShowAdd(false);
      toast.success('Reminder set!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('reminders').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const markDone = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('reminders').update({ is_done: true }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  const activeReminders = reminders.filter((r: any) => !r.is_done);
  const doneReminders = reminders.filter((r: any) => r.is_done).slice(0, 5);

  return (
    <GlassCard className="p-5" tilt={false}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Reminders</h3>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { requestNotificationPermission(); toast.success('Notifications enabled!'); }}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
            title="Enable browser notifications"
          >
            <BellRing className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAdd(!showAdd)}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Reminder title..."
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-foreground text-xs focus:outline-none focus:border-primary/30"
              />
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-foreground text-xs focus:outline-none focus:border-primary/30"
              />
              <input
                type="datetime-local"
                value={remindAt}
                onChange={e => setRemindAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-foreground text-xs focus:outline-none focus:border-primary/30"
              />
              <div className="flex gap-2">
                {(['none', 'daily', 'weekly'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRepeat(r)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] border transition-colors ${
                      repeat === r ? 'border-primary/40 text-primary bg-primary/10' : 'border-white/[0.06] text-muted-foreground'
                    }`}
                  >
                    <Repeat className="w-2.5 h-2.5" />
                    {r === 'none' ? 'Once' : r}
                  </button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => addMutation.mutate()}
                disabled={!title.trim() || !remindAt}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-30"
              >
                Set Reminder
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeReminders.length === 0 && !showAdd ? (
        <p className="text-xs text-muted-foreground text-center py-4">No active reminders</p>
      ) : (
        <div className="space-y-1.5">
          {activeReminders.map((r: any) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{r.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(r.remind_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {r.repeat !== 'none' && (
                    <span className="text-[10px] text-primary/60 flex items-center gap-0.5">
                      <Repeat className="w-2 h-2" /> {r.repeat}
                    </span>
                  )}
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => markDone.mutate(r.id)} className="p-1 text-emerald-400 hover:bg-emerald-400/10 rounded">
                <Check className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteMutation.mutate(r.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default ReminderManager;

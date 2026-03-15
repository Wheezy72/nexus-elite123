import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const REMINDER_INTERVALS: Record<string, { label: string; interval: number }> = {
  water: { label: '💧 Time to drink water!', interval: 60 * 60 * 1000 }, // 1hr
  posture: { label: '🧘 Check your posture!', interval: 45 * 60 * 1000 }, // 45min
  break: { label: '☕ Take a quick break!', interval: 90 * 60 * 1000 }, // 90min
};

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body?: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' });
  }
}

export function useInAppReminders(enabled: boolean = true) {
  const timers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (!enabled) return;

    timers.current = Object.entries(REMINDER_INTERVALS).map(([key, { label, interval }]) =>
      setInterval(() => {
        toast(label, { duration: 8000 });
        sendBrowserNotification('Future', label);
      }, interval)
    );

    return () => {
      timers.current.forEach(clearInterval);
    };
  }, [enabled]);
}

export function useScheduledReminders() {
  const { user } = useAuth();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    const checkReminders = async () => {
      const now = new Date().toISOString();
      const { data: reminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_done', false)
        .lte('remind_at', now);

      if (!reminders?.length) return;

      for (const r of reminders) {
        toast(`⏰ ${r.title}`, {
          description: r.description || undefined,
          duration: 10000,
        });
        sendBrowserNotification(r.title, r.description || undefined);

        if (r.repeat === 'none') {
          await supabase.from('reminders').update({ is_done: true }).eq('id', r.id);
        } else {
          const next = new Date(r.remind_at);
          if (r.repeat === 'daily') next.setDate(next.getDate() + 1);
          if (r.repeat === 'weekly') next.setDate(next.getDate() + 7);
          await supabase.from('reminders').update({ remind_at: next.toISOString() }).eq('id', r.id);
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [user]);
}

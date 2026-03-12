import { behaviorHistoryService } from '@/services/behaviorHistoryService';
import { calculateAnalytics, calculateCorrelations } from '@/lib/analytics';
import { behavioralAIService } from '@/services/behavioralAIService';

export interface NotificationPayload {
  type: 'insight' | 'motivation' | 'warning' | 'achievement' | 'fresh-content';
  priority: 'high' | 'normal' | 'low';
  title: string;
  body: string;
  action?: { label: string; target: string };
}

const ENABLED_KEY = 'nexus-smart-notifications-enabled';
const LAST_RUN_KEY = 'nexus-smart-notifications-last-run';

function isEnabled() {
  const raw = localStorage.getItem(ENABLED_KEY);
  if (raw == null) return true;
  try {
    return JSON.parse(raw) === true;
  } catch {
    return raw === '1' || raw === 'true';
  }
}

function inQuietHours(d: Date) {
  const hour = d.getHours();
  return hour >= 23 || hour < 7;
}

function nextAt(hour: number) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

function sendNotification(notif: NotificationPayload) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  new Notification(notif.title, {
    body: notif.body,
    tag: `nexus-${notif.type}`,
    requireInteraction: notif.priority === 'high',
  });
}

export const notificationService = {
  setEnabled(enabled: boolean) {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(enabled));
  },

  isEnabled,

  async requestPermission() {
    if (typeof Notification === 'undefined') return 'denied' as const;
    if (Notification.permission === 'granted') return 'granted' as const;
    return await Notification.requestPermission();
  },

  async generateNotifications(): Promise<NotificationPayload[]> {
    const history = await behaviorHistoryService.getBehaviorHistory('week');
    const analytics = calculateAnalytics(history);
    const correlations = calculateCorrelations(history);

    const notifications: NotificationPayload[] = [];

    if (analytics.wellnessScore <= 45) {
      notifications.push({
        type: 'warning',
        priority: 'high',
        title: 'Quick check-in',
        body: 'Your week looks heavy. Want a tiny plan for today?',
        action: { label: 'Talk to Nexus', target: '/chat' },
      });
    }

    const top = correlations[0];
    if (top && Math.abs(top.strength) >= 0.25) {
      notifications.push({
        type: 'insight',
        priority: 'normal',
        title: top.name,
        body: top.insight,
        action: { label: 'See insights', target: '/analytics' },
      });
    }

    const lastMood = history.slice().reverse().find(h => typeof h.mood === 'number')?.mood;
    if (typeof lastMood === 'number' && lastMood <= 2) {
      const profile = behavioralAIService.getCachedProfile() ?? (await behavioralAIService.refreshProfile());
      notifications.push({
        type: 'motivation',
        priority: 'high',
        title: "You've got this",
        body: profile.archetype === 'firefighter'
          ? 'Start with a 10-minute timer. Momentum beats pressure.'
          : 'Pick the smallest possible next step. Just start.',
      });
    }

    return notifications;
  },

  async runNow() {
    if (!isEnabled()) return;

    const now = new Date();
    if (inQuietHours(now)) return;

    const notifs = await this.generateNotifications();
    for (const n of notifs) sendNotification(n);
    localStorage.setItem(LAST_RUN_KEY, now.toISOString());
  },

  bootstrapDaily() {
    if (!isEnabled()) return;

    const lastRaw = localStorage.getItem(LAST_RUN_KEY);
    const lastRun = lastRaw ? new Date(lastRaw) : null;

    if (!lastRun || lastRun.toDateString() !== new Date().toDateString()) {
      this.runNow();
    }

    const nextRun = nextAt(9);
    window.setTimeout(() => {
      this.runNow();
      this.bootstrapDaily();
    }, nextRun.getTime() - Date.now());
  },
};

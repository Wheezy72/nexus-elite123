import { haptic } from './haptics';
import { addXP } from './gamification';
import { showGameToast } from '@/components/GameToasts';

// XP values for different actions
const XP_VALUES = {
  task_create: 5,
  task_complete: 15,
  task_move: 3,
  habit_check: 10,
  journal_entry: 12,
  feynman_save: 15,
  mood_log: 8,
  sleep_log: 10,
  water_drink: 3,
  water_goal: 20,
  goal_increment: 5,
  goal_complete: 25,
  note_create: 5,
  pomodoro_complete: 20,
  gratitude_log: 10,
  finance_review: 12,
} as const;

let pendingXP = 0;
let pendingAchievements: string[] = [];
let flushTimer: number | null = null;

function flushPending() {
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }

  const xp = pendingXP;
  const achievements = pendingAchievements;

  pendingXP = 0;
  pendingAchievements = [];

  if (xp > 0) {
    haptic('light');
    showGameToast('xp', `+${xp} XP`);
  }

  if (achievements.length) {
    achievements.slice(0, 3).forEach((name, i) => {
      window.setTimeout(() => {
        haptic('success');
        showGameToast('achievement', `Achievement: ${name}`);
      }, 450 + i * 350);
    });
  }
}

export function rewardAction(action: keyof typeof XP_VALUES) {
  const xpAmount = XP_VALUES[action];
  const result = addXP(xpAmount);

  // If we leveled up, show it immediately (and don't spam multiple XP toasts).
  if (result.leveledUp) {
    pendingXP = 0;
    pendingAchievements = [];
    if (flushTimer) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }

    haptic('success');
    showGameToast('levelup', `Level up! You're now level ${result.state.level}`);

    for (const name of result.newAchievements) {
      window.setTimeout(() => {
        haptic('success');
        showGameToast('achievement', `Achievement: ${name}`);
      }, 500);
    }

    return result;
  }

  pendingXP += xpAmount;
  pendingAchievements.push(...result.newAchievements);

  if (flushTimer) window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(flushPending, 1200);

  return result;
}

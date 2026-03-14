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

export function rewardAction(action: keyof typeof XP_VALUES) {
  const xpAmount = XP_VALUES[action];
  const result = addXP(xpAmount);
  
  // Haptic feedback
  if (result.leveledUp) {
    haptic('success');
    showGameToast('levelup', `Level up! You're now level ${result.state.level}`);
  } else {
    haptic('light');
    showGameToast('xp', `+${xpAmount} XP`);
  }
  
  // Show achievement toasts
  for (const name of result.newAchievements) {
    setTimeout(() => {
      haptic('success');
      showGameToast('achievement', `Achievement: ${name}`);
    }, 500);
  }
  
  return result;
}

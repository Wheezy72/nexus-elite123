// XP & Gamification engine
// Stores XP, level, streaks, achievements in localStorage

export interface GameState {
  xp: number;
  level: number;
  totalActions: number;
  streakDays: number;
  lastActiveDate: string;
  achievements: string[];
}

const STORAGE_KEY = 'nexus-game-state';
const XP_PER_LEVEL = 100;

const ACHIEVEMENT_DEFS: { id: string; name: string; desc: string; check: (s: GameState) => boolean }[] = [
  { id: 'first_action', name: 'First Step', desc: 'Perform your first action', check: s => s.totalActions >= 1 },
  { id: 'ten_actions', name: 'Getting Started', desc: 'Complete 10 actions', check: s => s.totalActions >= 10 },
  { id: 'fifty_actions', name: 'Consistent', desc: 'Complete 50 actions', check: s => s.totalActions >= 50 },
  { id: 'century', name: 'Centurion', desc: 'Complete 100 actions', check: s => s.totalActions >= 100 },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', check: s => s.level >= 5 },
  { id: 'level_10', name: 'Dedicated', desc: 'Reach level 10', check: s => s.level >= 10 },
  { id: 'streak_3', name: 'On Fire', desc: '3-day streak', check: s => s.streakDays >= 3 },
  { id: 'streak_7', name: 'Unstoppable', desc: '7-day streak', check: s => s.streakDays >= 7 },
  { id: 'streak_30', name: 'Legend', desc: '30-day streak', check: s => s.streakDays >= 30 },
];

function getState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    xp: 0,
    level: 1,
    totalActions: 0,
    streakDays: 0,
    lastActiveDate: '',
    achievements: [],
  };
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('nexus-game-update'));
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function addXP(amount: number): { newAchievements: string[]; leveledUp: boolean; state: GameState } {
  const state = getState();
  const today = todayKey();
  
  // Update streak
  if (state.lastActiveDate !== today) {
    if (state.lastActiveDate === yesterdayKey()) {
      state.streakDays += 1;
    } else if (state.lastActiveDate !== today) {
      state.streakDays = 1;
    }
    state.lastActiveDate = today;
  }
  
  state.xp += amount;
  state.totalActions += 1;
  
  const oldLevel = state.level;
  state.level = Math.floor(state.xp / XP_PER_LEVEL) + 1;
  const leveledUp = state.level > oldLevel;
  
  // Check achievements
  const newAchievements: string[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!state.achievements.includes(def.id) && def.check(state)) {
      state.achievements.push(def.id);
      newAchievements.push(def.name);
    }
  }
  
  saveState(state);
  return { newAchievements, leveledUp, state };
}

export function getGameState(): GameState {
  return getState();
}

export function getXPForNextLevel(state: GameState): { current: number; needed: number } {
  const currentLevelXP = (state.level - 1) * XP_PER_LEVEL;
  return {
    current: state.xp - currentLevelXP,
    needed: XP_PER_LEVEL,
  };
}

export function getAchievementDefs() {
  return ACHIEVEMENT_DEFS;
}

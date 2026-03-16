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

const STORAGE_KEY = 'future-game-state';
const MAX_LEVEL = 50;

function buildLevelThresholds() {
  const thresholds: number[] = [0];
  let total = 0;

  // Exponential ramp: early levels feel quick, later levels require real consistency.
  // lvl=1 -> 100xp, lvl=10 -> ~200xp, lvl=50 -> ~3800xp
  for (let lvl = 1; lvl < MAX_LEVEL; lvl++) {
    const raw = 100 * Math.pow(1.08, lvl - 1);
    const cost = Math.max(100, Math.round(raw / 5) * 5);
    total += cost;
    thresholds.push(total);
  }

  return thresholds; // length 50, thresholds[i] = total xp required to be level i+1
}

const LEVEL_XP = buildLevelThresholds();

function getLevelFromXP(xp: number) {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) return i + 1;
  }
  return 1;
}

export const TROPHY_DEFS: { id: string; name: string; desc: string; check: (s: GameState) => boolean }[] = [
  // Actions
  { id: 't_first_action', name: 'First Step', desc: 'Perform your first action', check: s => s.totalActions >= 1 },
  { id: 't_10_actions', name: 'Getting Started', desc: 'Complete 10 actions', check: s => s.totalActions >= 10 },
  { id: 't_50_actions', name: 'Consistent', desc: 'Complete 50 actions', check: s => s.totalActions >= 50 },
  { id: 't_100_actions', name: 'Centurion', desc: 'Complete 100 actions', check: s => s.totalActions >= 100 },
  { id: 't_250_actions', name: 'Momentum', desc: 'Complete 250 actions', check: s => s.totalActions >= 250 },
  { id: 't_500_actions', name: 'Workhorse', desc: 'Complete 500 actions', check: s => s.totalActions >= 500 },
  { id: 't_1000_actions', name: 'Machine', desc: 'Complete 1000 actions', check: s => s.totalActions >= 1000 },

  // Levels
  { id: 't_level_5', name: 'Rising Star', desc: 'Reach level 5', check: s => s.level >= 5 },
  { id: 't_level_10', name: 'Dedicated', desc: 'Reach level 10', check: s => s.level >= 10 },
  { id: 't_level_20', name: 'Focused', desc: 'Reach level 20', check: s => s.level >= 20 },
  { id: 't_level_30', name: 'Elite', desc: 'Reach level 30', check: s => s.level >= 30 },
  { id: 't_level_40', name: 'Unreal', desc: 'Reach level 40', check: s => s.level >= 40 },
  { id: 't_level_50', name: 'Legendary', desc: 'Reach level 50', check: s => s.level >= 50 },

  // Streaks
  { id: 't_streak_3', name: 'On Fire', desc: '3-day streak', check: s => s.streakDays >= 3 },
  { id: 't_streak_7', name: 'Unstoppable', desc: '7-day streak', check: s => s.streakDays >= 7 },
  { id: 't_streak_14', name: 'Two-Week Beast', desc: '14-day streak', check: s => s.streakDays >= 14 },
  { id: 't_streak_30', name: 'Habit Formed', desc: '30-day streak', check: s => s.streakDays >= 30 },
  { id: 't_streak_60', name: 'Locked In', desc: '60-day streak', check: s => s.streakDays >= 60 },
  { id: 't_streak_100', name: 'Mythic', desc: '100-day streak', check: s => s.streakDays >= 100 },
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
  window.dispatchEvent(new Event('future-game-update'));
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
  state.level = Math.min(MAX_LEVEL, getLevelFromXP(state.xp));
  const leveledUp = state.level > oldLevel;

  // Check trophies
  const newAchievements: string[] = [];
  for (const def of TROPHY_DEFS) {
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
  if (state.level >= MAX_LEVEL) {
    return { current: 0, needed: 0 };
  }

  const levelIndex = state.level - 1;
  const currentLevelXP = LEVEL_XP[levelIndex] ?? 0;
  const nextLevelXP = LEVEL_XP[levelIndex + 1] ?? currentLevelXP;

  return {
    current: Math.max(0, state.xp - currentLevelXP),
    needed: Math.max(0, nextLevelXP - currentLevelXP),
  };
}

export function getAchievementDefs() {
  return TROPHY_DEFS;
}

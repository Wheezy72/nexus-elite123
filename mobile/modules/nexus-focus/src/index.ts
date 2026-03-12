import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type FocusBlockLevel = 'silent' | 'vibrate' | 'important' | 'full';

export interface StartFocusArgs {
  durationMinutes: number;
  blockLevel: FocusBlockLevel;
  whitelistPackages?: string[];
  blockCategories?: string[];
}

export interface FocusSessionStatus {
  active: boolean;
  sessionId?: string;
  startAt?: number;
  endAt?: number;
  blockLevel?: FocusBlockLevel;
  blockedCount?: number;
}

export interface DistractionItem {
  id: string;
  ts: number;
  app: string;
  packageName: string;
  category: string;
  blocked: boolean;
  sessionId?: string | null;
}

export interface AnalyticsSummary {
  days: number;
  total: number;
  byApp: Array<{ app: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byHour: Array<{ hour: number; count: number }>;
}

export interface FocusSettings {
  enabled: boolean;
  defaultDurationMinutes: number;
  alwaysAllowedPackages: string[];
  blockedCategories: string[];

  scheduleEnabled: boolean;
  scheduleHour: number;
  scheduleMinute: number;
  scheduleDays: number[];
}

const LINKING_ERROR =
  `The package 'nexus-focus' doesn't seem to be linked.\n` +
  `Make sure you rebuilt the app after installing it.\n` +
  `Platform: ${Platform.OS}`;

const Native = NativeModules.NexusFocus
  ? NativeModules.NexusFocus
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const emitter = new NativeEventEmitter(Native);

export const NexusFocus = {
  addListener(eventName: 'FocusSessionStatus' | 'Distraction', listener: (event: any) => void) {
    return emitter.addListener(eventName, listener);
  },

  async hasNotificationAccess(): Promise<boolean> {
    return Native.hasNotificationAccess();
  },

  async openNotificationAccessSettings(): Promise<void> {
    return Native.openNotificationAccessSettings();
  },

  async hasDndAccess(): Promise<boolean> {
    return Native.hasDndAccess();
  },

  async openDndAccessSettings(): Promise<void> {
    return Native.openDndAccessSettings();
  },

  async getFocusStatus(): Promise<FocusSessionStatus> {
    return Native.getFocusStatus();
  },

  async startFocusSession(args: StartFocusArgs): Promise<FocusSessionStatus> {
    return Native.startFocusSession(args);
  },

  async stopFocusSession(): Promise<FocusSessionStatus> {
    return Native.stopFocusSession();
  },

  async getRecentDistractions(args: { limit: number }): Promise<DistractionItem[]> {
    return Native.getRecentDistractions(args);
  },

  async getDistractionAnalytics(args: { days: number }): Promise<AnalyticsSummary> {
    return Native.getDistractionAnalytics(args);
  },

  async getLastSessionSummary(): Promise<
    | null
    | {
        sessionId: string;
        startAt: number;
        endAt: number;
        blocked: number;
        byApp: Array<{ app: string; count: number }>;
        byCategory: Array<{ category: string; count: number }>;
        peakTime?: string;
      }
  > {
    return Native.getLastSessionSummary();
  },

  async getSettings(): Promise<FocusSettings> {
    return Native.getSettings();
  },

  async updateSettings(patch: Partial<FocusSettings>): Promise<FocusSettings> {
    return Native.updateSettings(patch);
  },

  async getGameState(): Promise<{
    xp: number;
    focusSessionsTotal: number;
    focusStreakDays: number;
    bestFocusMinutes: number;
    trophies: Record<string, boolean>;
  }> {
    return Native.getGameState();
  },

  async clearLocalData(): Promise<void> {
    return Native.clearLocalData();
  },
};

export type { FocusSessionStatus };

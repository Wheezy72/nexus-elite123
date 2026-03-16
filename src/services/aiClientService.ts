export type AIClientMode = 'off' | 'server' | 'openai' | 'gemini';

const MODE_KEY = 'future-ai-mode';
const BYOK_KEY = 'future-ai-byok-key';

function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export const aiClientService = {
  getMode(): AIClientMode {
    const raw = (safeGet(MODE_KEY) || 'server').replace(/"/g, '');
    if (raw === 'off' || raw === 'server' || raw === 'openai' || raw === 'gemini') return raw;
    return 'server';
  },

  setMode(mode: AIClientMode) {
    safeSet(MODE_KEY, JSON.stringify(mode));
  },

  getBYOKKey(): string | null {
    const raw = safeGet(BYOK_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : null;
    } catch {
      return null;
    }
  },

  setBYOKKey(key: string | null) {
    if (!key) {
      try {
        localStorage.removeItem(BYOK_KEY);
      } catch {
        // ignore
      }
      return;
    }
    safeSet(BYOK_KEY, JSON.stringify(key));
  },

  getRequestHeaders(): Record<string, string> {
    const mode = this.getMode();
    if (mode !== 'openai' && mode !== 'gemini') return {};

    const key = this.getBYOKKey();
    if (!key) return {};

    return {
      'x-ai-provider': mode,
      'x-ai-key': key,
    };
  },

  async getServerStatus(): Promise<{ enabled: boolean; provider: string } | null> {
    try {
      const resp = await fetch('/api/ai/status');
      if (!resp.ok) return null;
      const data = await resp.json();
      return {
        enabled: Boolean(data.enabled),
        provider: String(data.provider || 'mock'),
      };
    } catch {
      return null;
    }
  },

  async isAIEnabled(): Promise<boolean> {
    const mode = this.getMode();
    if (mode === 'off') return false;
    if (mode === 'openai' || mode === 'gemini') return Boolean(this.getBYOKKey());

    const status = await this.getServerStatus();
    return Boolean(status?.enabled);
  },
};

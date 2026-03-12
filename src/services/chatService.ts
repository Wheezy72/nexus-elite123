import { supabase } from '@/integrations/supabase/client';
import { decryptString, encryptString, type EncryptedPayload } from '@/lib/encryption';
import { pinLockService } from '@/services/pinLockService';
import { behavioralAIService } from '@/services/behavioralAIService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    citations?: string[];
  };
}

const STORAGE_KEY = 'nexus-chat-history';

type StoredChatBlob =
  | { v: 1; encrypted: true; payload: { ivB64: string; ciphertextB64: string } }
  | { v: 2; encrypted: true; payload: EncryptedPayload }
  | { v: 2; encrypted: false; messages: ChatMessage[] };

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function readStoredBlob(): Promise<StoredChatBlob | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Legacy format: we used to store a plain array.
    if (Array.isArray(parsed)) {
      return { v: 1, encrypted: false, messages: parsed };
    }

    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.v !== 1 && parsed.v !== 2) return null;

    if (parsed.encrypted === true && parsed.payload) {
      return parsed as StoredChatBlob;
    }

    if (parsed.encrypted === false && Array.isArray(parsed.messages)) {
      return parsed as StoredChatBlob;
    }

    return null;
  } catch {
    return null;
  }
}

async function writeStoredBlob(blob: StoredChatBlob) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
}

export const chatService = {
  async sendMessage(message: string, context?: unknown): Promise<ChatMessage> {
    const token = await getAccessToken();

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    const timeOfDay = behavioralAIService.getTimeOfDay();

    const [profile, moodRes, goalsRes] = await Promise.all([
      (async () => behavioralAIService.getCachedProfile() ?? behavioralAIService.refreshProfile())(),
      supabase.from('mood_entries').select('emoji,label').order('date', { ascending: false }).limit(1),
      supabase.from('goals').select('name,current,target').limit(5),
    ]);

    const moodEntry = moodRes.error ? null : (moodRes.data?.[0] ?? null);
    const moodValueByLabel: Record<string, number> = { Amazing: 5, Good: 4, Okay: 3, Low: 2, Rough: 1 };
    const recentMood = moodEntry ? (moodValueByLabel[moodEntry.label] ?? null) : null;

    const goals = goalsRes.error ? [] : (goalsRes.data ?? []);

    const fullContext = {
      ...(typeof context === 'object' && context != null ? context : {}),
      userId,
      timeOfDay,
      isADHDContext: true,
      userProfile: {
        archetype: profile.archetype,
        peakTime: profile.peakTime,
        strengths: profile.strengths,
        challenges: profile.challenges,
      },
      recentMood: typeof recentMood === 'number' ? recentMood : undefined,
      currentGoals: goals.map(g => ({
        title: g.name,
        status: g.current >= g.target ? 'complete' : `${g.current}/${g.target}`,
      })),
    };

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, context: fullContext }),
    });

    if (!response.ok) {
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: String(data.content ?? data.response ?? ''),
      timestamp: new Date().toISOString(),
      metadata: { citations: Array.isArray(data.citations) ? data.citations : [] },
    };
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    const blob = await readStoredBlob();
    if (!blob) return [];

    if (!blob.encrypted) {
      return Array.isArray(blob.messages) ? blob.messages : [];
    }

    const key = pinLockService.getVaultKey();
    if (!key) return [];

    const plaintext = await decryptString(blob.payload as EncryptedPayload, key);
    const parsed = JSON.parse(plaintext);
    return Array.isArray(parsed) ? parsed : [];
  },

  async saveMessage(message: ChatMessage) {
    const history = await this.getChatHistory();
    history.push(message);
    const trimmed = history.slice(-100);

    const key = pinLockService.getVaultKey();
    if (!key) {
      await writeStoredBlob({ v: 1, encrypted: false, messages: trimmed });
      return;
    }

    const payload = await encryptString(JSON.stringify(trimmed), key);
    await writeStoredBlob({ v: 2, encrypted: true, payload });
  },

  async clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  },
};

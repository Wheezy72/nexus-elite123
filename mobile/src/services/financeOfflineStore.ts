import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingTransaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
}

type OutboxItem = { type: 'insert_transaction'; payload: PendingTransaction };

type Cache = {
  v: 1;
  outbox: OutboxItem[];
};

const KEY = 'future-mobile-finance-outbox-v1';

async function readCache(): Promise<Cache> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { v: 1, outbox: [] };
  try {
    const parsed = JSON.parse(raw) as Cache;
    if (parsed?.v !== 1) return { v: 1, outbox: [] };
    return parsed;
  } catch {
    return { v: 1, outbox: [] };
  }
}

async function writeCache(cache: Cache) {
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
}

export const financeOfflineStore = {
  async addTransaction(tx: PendingTransaction) {
    const cache = await readCache();
    cache.outbox.push({ type: 'insert_transaction', payload: tx });
    await writeCache(cache);
  },

  pendingCount() {
    // best-effort; UI uses async counts through sync calls.
    return 0;
  },

  async getPendingCount() {
    const cache = await readCache();
    return cache.outbox.length;
  },

  async sync(supabase: any) {
    const cache = await readCache();
    if (!cache.outbox.length) return;

    const remaining: OutboxItem[] = [];
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) return;

    for (const item of cache.outbox) {
      try {
        if (item.type === 'insert_transaction') {
          const { error } = await supabase.from('finance_transactions').insert({
            user_id: userId,
            id: item.payload.id,
            date: item.payload.date,
            amount: item.payload.amount,
            category: item.payload.category,
            note: item.payload.note,
          });
          if (error) throw error;
        }
      } catch {
        remaining.push(item);
      }
    }

    await writeCache({ v: 1, outbox: remaining });
  },
};

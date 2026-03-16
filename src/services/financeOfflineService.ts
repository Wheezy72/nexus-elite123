export interface FinanceCachedTransaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
  pending?: boolean;
}

type FinanceOutboxItem =
  | { type: 'insert_transaction'; payload: FinanceCachedTransaction }
  | { type: 'delete_transaction'; payload: { id: string } }
  | { type: 'upsert_budget'; payload: { month: string; budget: number } };

interface FinanceMonthCache {
  v: 1;
  monthKey: string;
  snapshot: FinanceCachedTransaction[];
  budget: number | null;
  budgetPending?: boolean;
  outbox: FinanceOutboxItem[];
  updatedAt: string;
}

function cacheKey(userId: string, monthKey: string) {
  return `future-finance-cache-v1:${userId}:${monthKey}`;
}

function defaultCache(monthKey: string): FinanceMonthCache {
  return {
    v: 1,
    monthKey,
    snapshot: [],
    budget: null,
    outbox: [],
    updatedAt: new Date().toISOString(),
  };
}

function readCache(userId: string, monthKey: string): FinanceMonthCache {
  const raw = localStorage.getItem(cacheKey(userId, monthKey));
  if (!raw) return defaultCache(monthKey);

  try {
    const parsed = JSON.parse(raw) as FinanceMonthCache;
    if (parsed?.v !== 1) return defaultCache(monthKey);
    if (parsed.monthKey !== monthKey) return defaultCache(monthKey);
    return parsed;
  } catch {
    return defaultCache(monthKey);
  }
}

function writeCache(userId: string, monthKey: string, cache: FinanceMonthCache) {
  localStorage.setItem(
    cacheKey(userId, monthKey),
    JSON.stringify({ ...cache, updatedAt: new Date().toISOString() })
  );
}

export const financeOfflineService = {
  getMonthSnapshot(userId: string, monthKey: string) {
    return readCache(userId, monthKey);
  },

  setMonthSnapshot(userId: string, monthKey: string, next: Partial<FinanceMonthCache>) {
    const current = readCache(userId, monthKey);
    writeCache(userId, monthKey, { ...current, ...next });
  },

  addLocalTransaction(userId: string, monthKey: string, t: FinanceCachedTransaction) {
    const cache = readCache(userId, monthKey);
    const nextTx = [{ ...t, pending: true }, ...cache.snapshot.filter(x => x.id !== t.id)];
    writeCache(userId, monthKey, {
      ...cache,
      snapshot: nextTx,
      outbox: [...cache.outbox, { type: 'insert_transaction', payload: t }],
    });
  },

  deleteLocalTransaction(userId: string, monthKey: string, id: string) {
    const cache = readCache(userId, monthKey);
    writeCache(userId, monthKey, {
      ...cache,
      snapshot: cache.snapshot.filter(t => t.id !== id),
      outbox: [...cache.outbox, { type: 'delete_transaction', payload: { id } }],
    });
  },

  setLocalBudget(userId: string, monthKey: string, month: string, budget: number) {
    const cache = readCache(userId, monthKey);
    writeCache(userId, monthKey, {
      ...cache,
      budget,
      budgetPending: true,
      outbox: [...cache.outbox, { type: 'upsert_budget', payload: { month, budget } }],
    });
  },

  markBudgetSynced(userId: string, monthKey: string) {
    const cache = readCache(userId, monthKey);
    writeCache(userId, monthKey, { ...cache, budgetPending: false });
  },

  async syncMonth(userId: string, monthKey: string, supabase: any) {
    const cache = readCache(userId, monthKey);
    if (!cache.outbox.length) return;

    const remaining: FinanceOutboxItem[] = [];

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

          // clear pending flag locally
          const nextSnapshot = cache.snapshot.map(t => (t.id === item.payload.id ? { ...t, pending: false } : t));
          cache.snapshot = nextSnapshot;
        }

        if (item.type === 'delete_transaction') {
          const { error } = await supabase.from('finance_transactions').delete().eq('id', item.payload.id);
          if (error) throw error;
        }

        if (item.type === 'upsert_budget') {
          const { error } = await supabase.from('finance_budgets').upsert(
            { user_id: userId, month: item.payload.month, budget: item.payload.budget },
            { onConflict: 'user_id,month' }
          );
          if (error) throw error;
          cache.budgetPending = false;
        }
      } catch {
        remaining.push(item);
      }
    }

    writeCache(userId, monthKey, { ...cache, outbox: remaining });
  },
};

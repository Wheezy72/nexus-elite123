import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DollarSign,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Target,
  Trash2,
  Upload,
} from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import {
  useFinance,
  useFinanceCategories,
  useFinanceLimits,
  useFinanceSavingsGoals,
  type FinanceCategory,
} from '@/hooks/useCloudData';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { aiClientService } from '@/services/aiClientService';
import {
  buildBasicAlerts,
  buildSpendHeatmap,
  compareMonthsSeries,
  dailySpendSeries,
  detectAnomalies,
  groupSpendByCategory,
  sumPositiveAmount,
} from '@/lib/financeAnalytics';
import { DEFAULT_FINANCE_CATEGORIES, keywordCategorize, normalizeCategoryName } from '@/lib/financeCategorizer';
import { extractPdfTransactionsFromText, type ParsedPdfTransaction } from '@/lib/pdfReceiptParser';
import { parseMpesaSms } from '@/lib/mpesaSmsParser';

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonthKey(key: string) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return toMonthKey(d);
}

function currency(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function downloadCsv(filename: string, rows: Array<Record<string, string | number>>) {
  const headers = Object.keys(rows[0] || {});
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function colorForCategory(categories: FinanceCategory[], name: string) {
  const n = normalizeCategoryName(name);
  const match = categories.find(c => normalizeCategoryName(c.name) === n);
  if (match) return match.color;
  const base = DEFAULT_FINANCE_CATEGORIES.find(c => c.name === n);
  return base?.color || '#94a3b8';
}

async function readPdfText(file: File): Promise<string> {
  const version = '4.10.38';
  const pdfjs = await import(
    /* @vite-ignore */ `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.mjs`
  );

  // @ts-expect-error - pdfjs types vary by build.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  // @ts-expect-error - pdfjs types vary by build.
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // @ts-expect-error - pdfjs item types.
    out += content.items.map(it => it.str).join('\n');
    out += '\n';
  }
  return out;
}

const FinancePage: React.FC = () => {
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const prevMonth = useMemo(() => prevMonthKey(month), [month]);

  const current = useFinance(month);
  const previous = useFinance(prevMonth);
  const categoriesHook = useFinanceCategories();
  const goalsHook = useFinanceSavingsGoals();
  const limitsHook = useFinanceLimits();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  const [aiRecs, setAiRecs] = useState<string[] | null>(null);
  const insightTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const enabled = await aiClientService.isAIEnabled();
        if (!cancelled) setAiEnabled(enabled);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // AI insights fetched below (after derived values are computed)

  const totalSpent = useMemo(() => sumPositiveAmount(current.transactions), [current.transactions]);
  const byCategory = useMemo(() => groupSpendByCategory(current.transactions), [current.transactions]);

  const budgetValue = current.budget ? Number(current.budget.budget) : null;
  const remaining = budgetValue != null ? budgetValue - totalSpent : null;
  const pct = budgetValue ? Math.min(1.5, totalSpent / Math.max(1, budgetValue)) : null;

  useEffect(() => {
    if (!aiEnabled) {
      setAiInsights(null);
      setAiRecs(null);
      return;
    }

    if (insightTimer.current) window.clearTimeout(insightTimer.current);

    insightTimer.current = window.setTimeout(async () => {
      try {
        const resp = await fetch('/api/ai/finance/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...aiClientService.getRequestHeaders() },
          body: JSON.stringify({ monthKey: month, budget: budgetValue, totalSpent, byCategory }),
        });
        if (!resp.ok) return;
        const data = await resp.json();
        setAiInsights(Array.isArray(data.insights) ? data.insights : null);
        setAiRecs(Array.isArray(data.recommendations) ? data.recommendations : null);
      } catch {
        // ignore
      }
    }, 400);

    return () => {
      if (insightTimer.current) window.clearTimeout(insightTimer.current);
    };
  }, [aiEnabled, month, budgetValue, totalSpent, byCategory]);

  const daily = useMemo(() => dailySpendSeries(current.transactions, month), [current.transactions, month]);
  const compare = useMemo(
    () => compareMonthsSeries(current.transactions, previous.transactions, month),
    [current.transactions, previous.transactions, month]
  );
  const heat = useMemo(() => buildSpendHeatmap(current.transactions), [current.transactions]);
  const anomalies = useMemo(() => detectAnomalies(current.transactions), [current.transactions]);

  const alerts = useMemo(
    () =>
      buildBasicAlerts({
        monthKey: month,
        totalSpent,
        budget: budgetValue,
        byCategory,
        limits: limitsHook.limits,
        transactions: current.transactions,
      }),
    [month, totalSpent, budgetValue, byCategory, limitsHook.limits, current.transactions]
  );

  const mergedCategories = useMemo(() => {
    const fromDb = categoriesHook.categories;
    const existing = new Set(fromDb.map(c => normalizeCategoryName(c.name)));
    const merged = [...fromDb];
    for (const base of DEFAULT_FINANCE_CATEGORIES) {
      if (!existing.has(base.name)) {
        merged.push({ id: `base-${base.name}`, name: base.name, color: base.color, createdAt: '' });
      }
    }
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesHook.categories]);

  useEffect(() => {
    // default selected category to first custom category if available
    if (!mergedCategories.length) return;
    if (!mergedCategories.some(c => c.name === category)) {
      setCategory(mergedCategories[0].name);
    }
  }, [mergedCategories]);

  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = current.transactions.filter(t => {
      if (filterCat !== 'all' && normalizeCategoryName(t.category) !== normalizeCategoryName(filterCat)) return false;
      if (!q) return true;
      return (
        t.note.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.date.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'date_desc') return b.date.localeCompare(a.date);
      if (sort === 'date_asc') return a.date.localeCompare(b.date);
      if (sort === 'amount_desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });

    return sorted;
  }, [current.transactions, search, filterCat, sort]);

  const add = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      await current.addTransaction.mutateAsync({ date, amount: n, category, note });
      setAmount('');
      setNote('');
      toast.success(navigator.onLine ? 'Saved' : 'Saved offline (will sync)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const ensureCategoryExists = async (name: string) => {
    const normalized = normalizeCategoryName(name);
    const exists = categoriesHook.categories.some(c => normalizeCategoryName(c.name) === normalized);
    if (exists) return;

    const base = DEFAULT_FINANCE_CATEGORIES.find(c => c.name === normalized);
    if (!base) return;

    try {
      await categoriesHook.addCategory.mutateAsync({ name: base.name, color: base.color });
    } catch {
      // ignore
    }
  };

  const suggestCategory = async (merchantOrNote: string) => {
    if (!aiEnabled) return keywordCategorize(merchantOrNote);

    try {
      const resp = await fetch('/api/ai/finance/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...aiClientService.getRequestHeaders() },
        body: JSON.stringify({
          merchant: merchantOrNote,
          categories: mergedCategories.map(c => c.name),
        }),
      });
      if (!resp.ok) throw new Error('AI categorize failed');
      const data = await resp.json();
      const cat = typeof data.category === 'string' ? data.category : '';
      const normalized = normalizeCategoryName(cat);
      if (!normalized) return keywordCategorize(merchantOrNote);
      return normalized;
    } catch {
      return keywordCategorize(merchantOrNote);
    }
  };

  const PdfImportCard = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [items, setItems] = useState<Array<ParsedPdfTransaction & { category: string; selected: boolean }>>([]);

    const loadPdfJs = async () => {
      const w = window as any;
      if (w.pdfjsLib) return w.pdfjsLib;

      await new Promise<void>((resolve, reject) => {
        const el = document.createElement('script');
        el.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.min.js';
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error('Failed to load PDF.js'));
        document.head.appendChild(el);
      });

      if (!w.pdfjsLib) throw new Error('PDF.js not available');
      w.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.js';
      return w.pdfjsLib;
    };

    const pick = () => inputRef.current?.click();

    const onFile = async (file: File) => {
      if (!navigator.onLine) {
        toast.error('PDF import needs an internet connection (loads PDF.js from CDN)');
        return;
      }

      setBusy(true);
      try {
        const pdfjs = await loadPdfJs();
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;

        const parts: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const lines = (content.items || [])
            .map((it: any) => (typeof it.str === 'string' ? it.str : ''))
            .filter(Boolean);
          parts.push(lines.join('\n'));
        }

        const text = parts.join('\n');
        const extracted = extractPdfTransactionsFromText(text);

        const hydrated = await Promise.all(
          extracted.map(async tx => {
            const cat = await suggestCategory(tx.merchant);
            await ensureCategoryExists(cat);
            return { ...tx, category: cat, selected: true };
          })
        );

        setItems(hydrated);
        if (!hydrated.length) toast.error('No transactions found in that PDF');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to read PDF');
      } finally {
        setBusy(false);
      }
    };

    const importSelected = async () => {
      const chosen = items.filter(i => i.selected);
      for (const it of chosen) {
        const txDate = it.date || new Date().toISOString().split('T')[0];
        await current.addTransaction.mutateAsync({ date: txDate, amount: it.amount, category: it.category, note: it.merchant });
      }
      toast.success(navigator.onLine ? 'Imported' : 'Imported offline (will sync)');
      setItems([]);
    };

    return (
      <GlassCard className="p-5" tilt={false}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Import from PDF</h3>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={pick}
            className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors"
          >
            Choose PDF
          </motion.button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.currentTarget.value = '';
            }}
          />
        </div>

        <p className="text-[10px] text-muted-foreground mt-2">
          Client-side extraction (the server never sees your raw PDF). PDF parsing downloads PDF.js from a CDN, so it needs an internet connection.
        </p>

        {busy ? (
          <p className="text-xs text-muted-foreground mt-4">Reading PDF…</p>
        ) : items.length ? (
          <div className="mt-4 space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <input
                  type="checkbox"
                  checked={it.selected}
                  onChange={e => setItems(prev => prev.map((x, i) => (i === idx ? { ...x, selected: e.target.checked } : x)))}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {it.merchant} · {currency(it.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{it.date || '—'} · confidence {(it.confidence * 100).toFixed(0)}%</p>
                </div>
                <select
                  value={it.category}
                  onChange={e => setItems(prev => prev.map((x, i) => (i === idx ? { ...x, category: e.target.value } : x)))}
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-xs outline-none focus:border-primary/40"
                >
                  {mergedCategories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={importSelected}
              className="mt-2 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
            >
              Import selected ({items.filter(i => i.selected).length})
            </motion.button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-4">Upload a bank statement or receipt PDF to extract transactions.</p>
        )}
      </GlassCard>
    );
  };

  const SmsImportCard = () => {
    const [raw, setRaw] = useState('');
    const [parsed, setParsed] = useState<Array<{ raw: string; merchant: string; amount: number; date?: string; category: string; selected: boolean }>>(
      []
    );

    const parse = async () => {
      const lines = raw
        .split(/\n\s*\n|\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

      const items = await Promise.all(
        lines
          .map(line => {
            const tx = parseMpesaSms(line);
            if (!tx) return null;
            return tx;
          })
          .filter(Boolean)
          .map(async tx => {
            const cat = await suggestCategory(tx!.merchant);
            await ensureCategoryExists(cat);
            return {
              raw: tx!.raw,
              merchant: tx!.merchant,
              amount: tx!.amount,
              date: tx!.date,
              category: cat,
              selected: true,
            };
          })
      );

      setParsed(items);
    };

    const importSelected = async () => {
      const chosen = parsed.filter(i => i.selected);
      for (const it of chosen) {
        const txDate = it.date || new Date().toISOString().split('T')[0];
        await current.addTransaction.mutateAsync({ date: txDate, amount: it.amount, category: it.category, note: it.merchant });
      }
      toast.success(navigator.onLine ? 'Imported' : 'Imported offline (will sync)');
      setParsed([]);
      setRaw('');
    };

    return (
      <GlassCard className="p-5" tilt={false}>
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Import from SMS (paste)</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Paste M-Pesa messages (one per line or separated by blank lines). Mobile auto-read is available in the Expo app.
        </p>

        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder="e.g. QW12ABCD34 Confirmed. Ksh250.00 paid to SAFARICOM LTD on 12/03/2026..."
          className="mt-3 w-full min-h-24 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
        />

        <div className="mt-3 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={parse}
            disabled={!raw.trim()}
            className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            Parse
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={importSelected}
            disabled={!parsed.length}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
          >
            Import selected ({parsed.filter(i => i.selected).length})
          </motion.button>
        </div>

        {parsed.length ? (
          <div className="mt-3 space-y-2">
            {parsed.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <input
                  type="checkbox"
                  checked={it.selected}
                  onChange={e => setParsed(prev => prev.map((x, i) => (i === idx ? { ...x, selected: e.target.checked } : x)))}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {it.merchant} · {currency(it.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{it.date || '—'}</p>
                </div>
                <select
                  value={it.category}
                  onChange={e => setParsed(prev => prev.map((x, i) => (i === idx ? { ...x, category: e.target.value } : x)))}
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-xs outline-none focus:border-primary/40"
                >
                  {mergedCategories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : null}
      </GlassCard>
    );
  };

  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-5xl">
        <motion.div variants={staggerItem} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Finance</h1>
            <p className="text-[11px] text-muted-foreground">
              {navigator.onLine ? 'Online' : 'Offline mode'}{current.budget?.pending ? ' · budget pending sync' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="glass rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                try {
                  await current.syncNow.mutateAsync();
                  toast.success('Synced');
                } catch {
                  toast.error('Sync failed');
                }
              }}
              disabled={!navigator.onLine || current.syncNow.isPending}
              className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              title="Sync now"
            >
              <RefreshCw className={`w-4 h-4 ${current.syncNow.isPending ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full justify-start bg-white/[0.03] border border-white/[0.06] rounded-2xl p-1">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="goals">Savings</TabsTrigger>
              <TabsTrigger value="settings">Limits</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <GlassCard className="p-5" tilt={false}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">This month</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] text-muted-foreground">Spent</p>
                      <p className="text-xl font-bold text-foreground tabular-nums">{currency(totalSpent)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] text-muted-foreground">Budget</p>
                      <p className="text-xl font-bold text-foreground tabular-nums">{budgetValue != null ? currency(budgetValue) : '—'}</p>
                      {remaining != null && (
                        <p className={`text-[10px] mt-1 ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {remaining >= 0 ? 'Remaining' : 'Over by'} {currency(Math.abs(remaining))}
                        </p>
                      )}
                    </div>
                  </div>

                  {budgetValue != null ? (
                    <div className="mt-3">
                      <Progress value={pct ? Math.min(100, pct * 100) : 0} className="h-2" />
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {pct ? `${(pct * 100).toFixed(0)}% used` : ''}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Set monthly budget"
                      defaultValue={budgetValue != null ? String(budgetValue) : ''}
                      onKeyDown={async e => {
                        if (e.key !== 'Enter') return;
                        const v = Number((e.target as HTMLInputElement).value);
                        if (!Number.isFinite(v) || v <= 0) {
                          toast.error('Enter a valid budget');
                          return;
                        }
                        await current.setBudget.mutateAsync(v);
                        toast.success(navigator.onLine ? 'Budget saved' : 'Budget saved offline');
                      }}
                      className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground shrink-0">Enter</p>
                  </div>
                </GlassCard>

                <GlassCard className="p-5 lg:col-span-2" tilt={false}>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Budget intelligence</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {alerts.slice(0, 6).map(a => (
                      <div
                        key={a.id}
                        className={`p-3 rounded-2xl border ${a.level === 'warn' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-white/[0.03] border-white/[0.06]'}`}
                      >
                        <p className="text-xs font-semibold text-foreground">{a.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{a.detail}</p>
                      </div>
                    ))}
                  </div>

                  {aiEnabled && (aiInsights?.length || aiRecs?.length) ? (
                    <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      {aiInsights?.length ? (
                        <>
                          <p className="text-xs font-semibold text-foreground">AI insights</p>
                          <ul className="mt-2 text-[11px] text-muted-foreground list-disc pl-4 space-y-1">
                            {aiInsights.slice(0, 4).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                      {aiRecs?.length ? (
                        <>
                          <p className="text-xs font-semibold text-foreground mt-3">Recommendations</p>
                          <ul className="mt-2 text-[11px] text-muted-foreground list-disc pl-4 space-y-1">
                            {aiRecs.slice(0, 4).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  {anomalies.length ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-foreground">Unusual charges</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {anomalies.slice(0, 2).map(a => `${currency(a.amount)} (${a.note || a.category})`).join(' · ')}
                      </p>
                    </div>
                  ) : null}

                  <p className="text-[10px] text-muted-foreground mt-3">
                    {aiEnabled ? 'AI suggestions enabled' : 'Basic (no API key)'} · Customize warnings in the “Limits” tab.
                  </p>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GlassCard className="p-5" tilt={false}>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Pie: category share</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                            fontSize: 12,
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                        <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                          {byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colorForCategory(mergedCategories, entry.name)} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-5" tilt={false}>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Bar: spend by category</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byCategory.slice(0, 10)}>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                            fontSize: 12,
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {byCategory.slice(0, 10).map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={colorForCategory(mergedCategories, entry.name)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-5" tilt={false}>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Line: daily cumulative spend</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={daily}>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                            fontSize: 12,
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                        <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-5" tilt={false}>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Comparison: current vs previous month</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compare.series}>
                        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.35} />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 12,
                            fontSize: 12,
                            color: 'hsl(var(--foreground))',
                          }}
                        />
                        <Line type="monotone" dataKey="current" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="previous" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Previous month: {compare.prevKey}</p>
                </GlassCard>
              </div>

              <GlassCard className="p-5" tilt={false}>
                <h3 className="text-sm font-semibold text-foreground mb-2">Heatmap: when you spend</h3>
                <div className="overflow-x-auto">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-7 gap-2 ml-12">
                      {heat.weekLabels.map(w => (
                        <p key={w} className="text-[10px] text-muted-foreground text-center">
                          {w}
                        </p>
                      ))}
                    </div>

                    <div className="mt-2 space-y-2">
                      {heat.matrix.map((row, r) => (
                        <div key={r} className="flex items-center gap-2">
                          <p className="w-10 text-[10px] text-muted-foreground">{heat.weekdayLabels[r]}</p>
                          <div className="grid grid-cols-6 gap-2 flex-1">
                            {row.map((v, c) => {
                              const intensity = heat.max ? v / heat.max : 0;
                              const bg = `hsl(var(--primary) / ${Math.min(0.85, 0.08 + intensity * 0.85)})`;
                              return (
                                <div
                                  key={c}
                                  title={`${heat.weekdayLabels[r]} ${heat.weekLabels[c]}: ${currency(v)}`}
                                  className="h-9 rounded-xl border border-white/[0.08]"
                                  style={{ background: v > 0 ? bg : 'rgba(255,255,255,0.02)' }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <GlassCard className="p-5 lg:col-span-2" tilt={false}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-foreground">Transactions</h2>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search"
                          className="pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-xs outline-none focus:border-primary/40"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={filterCat}
                          onChange={e => setFilterCat(e.target.value)}
                          className="pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-xs outline-none focus:border-primary/40"
                        >
                          <option value="all">All</option>
                          {mergedCategories.map(c => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <select
                        value={sort}
                        onChange={e => setSort(e.target.value as any)}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-xs outline-none focus:border-primary/40"
                      >
                        <option value="date_desc">Newest</option>
                        <option value="date_asc">Oldest</option>
                        <option value="amount_desc">Amount ↓</option>
                        <option value="amount_asc">Amount ↑</option>
                      </select>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!filteredTransactions.length) return;
                          downloadCsv(
                            `future-finance-${month}.csv`,
                            filteredTransactions.map(t => ({
                              date: t.date,
                              amount: t.amount,
                              category: t.category,
                              note: t.note,
                              pending: t.pending ? 'yes' : 'no',
                            }))
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                        title="Export CSV"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </motion.button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {current.isLoading ? (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    ) : filteredTransactions.length ? (
                      filteredTransactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorForCategory(mergedCategories, t.category) }} />
                                {t.category}
                              </span>
                              <span className="ml-2 tabular-nums">· {currency(t.amount)}</span>
                              {t.pending ? <span className="ml-2 text-[10px] text-muted-foreground">(pending)</span> : null}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{t.date}{t.note ? ` · ${t.note}` : ''}</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              await current.deleteTransaction.mutateAsync(t.id);
                              toast.success(navigator.onLine ? 'Deleted' : 'Deleted offline (will sync)');
                            }}
                            className="p-2 rounded-xl hover:bg-white/[0.04] text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No matches.</p>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-5" tilt={false}>
                  <h2 className="text-sm font-semibold text-foreground mb-4">Add transaction</h2>

                  <label className="text-[11px] text-muted-foreground">Amount</label>
                  <input
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g., 250"
                    className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground">Category</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                      >
                        {mergedCategories.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                      />
                    </div>
                  </div>

                  <label className="text-[11px] text-muted-foreground mt-3 block">Note (merchant, reference, etc.)</label>
                  <input
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g., lunch"
                    className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={add}
                    disabled={current.addTransaction.isPending}
                    className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Save
                  </motion.button>

                  <p className="text-[10px] text-muted-foreground mt-3">
                    {aiEnabled ? 'AI category suggestions are available in imports.' : 'Enable an AI key in backend/.env for smarter imports.'}
                  </p>
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="import" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PdfImportCard />
                <SmsImportCard />
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GlassCard className="p-5" tilt={false}>
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Create category</h2>
                  </div>

                  <CategoryCreateForm
                    onCreate={async (name, color) => {
                      const n = normalizeCategoryName(name);
                      if (!n) return;
                      await categoriesHook.addCategory.mutateAsync({ name: n, color });
                      toast.success('Category saved');
                    }}
                  />

                  <p className="text-[10px] text-muted-foreground mt-3">Tip: use a small set of categories you’ll actually review.</p>
                </GlassCard>

                <GlassCard className="p-5" tilt={false}>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Your categories</h2>
                  {categoriesHook.isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : categoriesHook.categories.length ? (
                    <div className="space-y-2">
                      {categoriesHook.categories.map(c => (
                        <div key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                            <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              await categoriesHook.deleteCategory.mutateAsync(c.id);
                              toast.success('Deleted');
                            }}
                            className="p-2 rounded-xl hover:bg-white/[0.04] text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No custom categories yet.</p>
                  )}
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GlassCard className="p-5" tilt={false}>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Savings goals</h2>
                  </div>

                  <SavingsGoalCreateForm
                    onCreate={async (name, target, targetDate) => {
                      await goalsHook.addGoal.mutateAsync({ name, target, targetDate });
                      toast.success('Goal added');
                    }}
                  />

                  <p className="text-[10px] text-muted-foreground mt-3">Track targets and progress. Use “+” buttons to update current amount.</p>
                </GlassCard>

                <GlassCard className="p-5" tilt={false}>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Active goals</h2>
                  {goalsHook.isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : goalsHook.goals.length ? (
                    <div className="space-y-2">
                      {goalsHook.goals.map(g => {
                        const pct = Math.min(100, (g.current / Math.max(1, g.target)) * 100);
                        return (
                          <div key={g.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{g.name}</p>
                                <p className="text-[10px] text-muted-foreground">{currency(g.current)} / {currency(g.target)}{g.targetDate ? ` · by ${g.targetDate}` : ''}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <motion.button
                                  whileTap={{ scale: 0.98 }}
                                  onClick={async () => {
                                    const inc = Number(prompt('Add amount:', '100') || '0');
                                    if (!Number.isFinite(inc) || inc <= 0) return;
                                    await goalsHook.updateGoal.mutateAsync({ id: g.id, current: g.current + inc });
                                  }}
                                  className="px-3 py-2 rounded-xl bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"
                                >
                                  +
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.98 }}
                                  onClick={async () => {
                                    if (!confirm('Delete goal?')) return;
                                    await goalsHook.deleteGoal.mutateAsync(g.id);
                                  }}
                                  className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors"
                                >
                                  Delete
                                </motion.button>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Progress value={pct} className="h-2" />
                              <p className="text-[10px] text-muted-foreground mt-1">{pct.toFixed(0)}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No goals yet.</p>
                  )}
                </GlassCard>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GlassCard className="p-5" tilt={false}>
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">Custom limits</h2>
                  </div>

                  <LimitCreateForm
                    categories={mergedCategories}
                    onSave={async (period, limit, warnAtPercent, cat) => {
                      await limitsHook.upsertLimit.mutateAsync({ period, limit, warnAtPercent, category: cat || null });
                      toast.success('Limit saved');
                    }}
                  />

                  <p className="text-[10px] text-muted-foreground mt-3">
                    Limits are used for warnings (75%, overspend pace, etc.). Add one per day/week/month, optionally per category.
                  </p>
                </GlassCard>

                <GlassCard className="p-5" tilt={false}>
                  <h2 className="text-sm font-semibold text-foreground mb-3">Saved limits</h2>
                  {limitsHook.isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  ) : limitsHook.limits.length ? (
                    <div className="space-y-2">
                      {limitsHook.limits.map(l => (
                        <div key={l.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {l.period}{l.category ? ` · ${l.category}` : ''}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Limit {currency(l.limit)} · warn at {l.warnAtPercent}%</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              await limitsHook.deleteLimit.mutateAsync({ period: l.period, category: l.category || null });
                              toast.success('Deleted');
                            }}
                            className="p-2 rounded-xl hover:bg-white/[0.04] text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No limits yet.</p>
                  )}
                </GlassCard>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

function CategoryCreateForm({ onCreate }: { onCreate: (name: string, color: string) => void | Promise<void> }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  return (
    <div className="mt-4">
      <label className="text-[11px] text-muted-foreground">Name</label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g., utilities"
        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
      />

      <label className="text-[11px] text-muted-foreground mt-3 block">Color</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-12 h-10 rounded-xl bg-transparent border border-white/[0.08]"
        />
        <input
          value={color}
          onChange={e => setColor(e.target.value)}
          className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (!name.trim()) return;
          onCreate(name, color);
          setName('');
        }}
        className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
      >
        Save
      </motion.button>
    </div>
  );
}

function SavingsGoalCreateForm({
  onCreate,
}: {
  onCreate: (name: string, target: number, targetDate?: string) => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');

  return (
    <div className="mt-4">
      <label className="text-[11px] text-muted-foreground">Name</label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g., Laptop"
        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
      />

      <label className="text-[11px] text-muted-foreground mt-3 block">Target amount</label>
      <input
        value={target}
        onChange={e => setTarget(e.target.value)}
        type="number"
        min={1}
        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
      />

      <label className="text-[11px] text-muted-foreground mt-3 block">Target date (optional)</label>
      <input
        value={date}
        onChange={e => setDate(e.target.value)}
        type="date"
        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
      />

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          const n = name.trim();
          const t = Number(target);
          if (!n || !Number.isFinite(t) || t <= 0) return;
          onCreate(n, t, date || undefined);
          setName('');
          setTarget('');
          setDate('');
        }}
        className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
      >
        Add goal
      </motion.button>
    </div>
  );
}

function LimitCreateForm({
  categories,
  onSave,
}: {
  categories: FinanceCategory[];
  onSave: (
    period: 'daily' | 'weekly' | 'monthly',
    limit: number,
    warnAtPercent: number,
    category?: string
  ) => void | Promise<void>;
}) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [limit, setLimit] = useState('');
  const [warn, setWarn] = useState('75');
  const [category, setCategory] = useState<string>('');

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-muted-foreground">Period</label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
          >
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
            <option value="monthly">monthly</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Warn at %</label>
          <input
            value={warn}
            onChange={e => setWarn(e.target.value)}
            type="number"
            min={1}
            max={100}
            className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      <label className="text-[11px] text-muted-foreground mt-3 block">Limit amount</label>
      <input
        value={limit}
        onChange={e => setLimit(e.target.value)}
        type="number"
        min={1}
        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
      />

      <label className="text-[11px] text-muted-foreground mt-3 block">Category (optional)</label>
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
      >
        <option value="">All categories</option>
        {categories.map(c => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          const l = Number(limit);
          const w = Number(warn);
          if (!Number.isFinite(l) || l <= 0) return;
          if (!Number.isFinite(w) || w <= 0 || w > 100) return;
          onSave(period, l, w, category || undefined);
          setLimit('');
        }}
        className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold"
      >
        Save limit
      </motion.button>
    </div>
  );
}

export default FinancePage;

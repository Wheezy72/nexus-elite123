export interface ParsedPdfTransaction {
  date?: string;
  amount: number;
  merchant: string;
  note?: string;
  confidence: number;
}

const DATE_PATTERNS: RegExp[] = [
  /(\d{4})-(\d{2})-(\d{2})/, // 2026-03-12
  /(\d{2})\/(\d{2})\/(\d{4})/, // 12/03/2026
];

function normalizeAmount(raw: string) {
  const cleaned = raw.replace(/[,\s]/g, '');
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : null;
}

export function extractPdfTransactionsFromText(text: string): ParsedPdfTransaction[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const candidates: ParsedPdfTransaction[] = [];

  // Heuristic: rows where the last number looks like an amount.
  for (const line of lines) {
    const amountMatch = line.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*$/);
    if (!amountMatch) continue;

    const amount = normalizeAmount(amountMatch[1]);
    if (!amount || amount <= 0) continue;

    let date: string | undefined;
    for (const p of DATE_PATTERNS) {
      const m = line.match(p);
      if (m) {
        if (p.source.startsWith('(\\d{4})')) {
          date = `${m[1]}-${m[2]}-${m[3]}`;
        } else {
          // dd/mm/yyyy -> yyyy-mm-dd
          date = `${m[3]}-${m[2]}-${m[1]}`;
        }
        break;
      }
    }

    const merchant = line
      .replace(amountMatch[0], '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!merchant || merchant.length < 2) continue;

    const confidence = date ? 0.75 : 0.55;
    candidates.push({ amount, merchant: merchant.slice(0, 80), date, confidence });
  }

  // Deduplicate (merchant+amount)
  const seen = new Set<string>();
  const out: ParsedPdfTransaction[] = [];
  for (const c of candidates) {
    const key = `${c.merchant.toLowerCase()}|${c.amount.toFixed(2)}|${c.date || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }

  return out.sort((a, b) => b.confidence - a.confidence).slice(0, 50);
}

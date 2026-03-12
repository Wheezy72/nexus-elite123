export interface MpesaTransaction {
  amount: number;
  currency: string;
  merchant: string;
  reference?: string;
  date?: string;
  raw: string;
}

function parseAmount(text: string) {
  const m = text.match(/(Ksh|KES)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i);
  if (!m) return null;
  const amount = Number(m[2].replace(/,/g, ''));
  if (!Number.isFinite(amount)) return null;
  return { amount, currency: m[1].toUpperCase() === 'KSH' ? 'KES' : m[1].toUpperCase() };
}

function parseMerchant(text: string) {
  const paidTo = text.match(/(?:paid to|to)\s+([A-Z0-9\s.&'-]{3,})/i);
  if (paidTo) return paidTo[1].trim();

  const at = text.match(/\sat\s+([A-Z0-9\s.&'-]{3,})/i);
  if (at) return at[1].trim();

  return 'M-Pesa';
}

function parseDate(text: string) {
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dm = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dm) {
    const yyyy = dm[3].length === 2 ? `20${dm[3]}` : dm[3];
    return `${yyyy}-${String(dm[2]).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`;
  }
  return undefined;
}

export function parseMpesaSms(message: string): MpesaTransaction | null {
  const raw = message.trim();
  if (!raw) return null;

  const amt = parseAmount(raw);
  if (!amt) return null;

  const merchant = parseMerchant(raw);
  const date = parseDate(raw);
  const ref = raw.match(/\b([A-Z0-9]{10})\b/);

  return {
    amount: amt.amount,
    currency: amt.currency,
    merchant,
    reference: ref ? ref[1] : undefined,
    date,
    raw,
  };
}

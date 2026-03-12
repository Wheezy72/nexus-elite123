const KEYWORD_MAP: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /safaricom|airtime|data|bundle/i, category: 'utilities' },
  { pattern: /kplc|token|electric/i, category: 'utilities' },
  { pattern: /water|nairobi water/i, category: 'utilities' },
  { pattern: /equity|kcb|coop|co-?operative|absa|stanbic|mpesa|m-pesa|paybill/i, category: 'banking' },
  { pattern: /uber|bolt|taxi|matatu|bus|train|fuel|petrol|diesel/i, category: 'transport' },
  { pattern: /naivas|carrefour|quickmart|supermarket|grocer|grocery/i, category: 'groceries' },
  { pattern: /cafe|coffee|java|artcaffe|restaurant|kfc|pizza|burger|lunch|dinner/i, category: 'food' },
  { pattern: /rent|landlord|hostel|housing/i, category: 'rent' },
  { pattern: /tuition|school|exam|library|stationery|book|printing/i, category: 'school' },
  { pattern: /netflix|spotify|cinema|movie|game/i, category: 'entertainment' },
  { pattern: /pharmacy|hospital|clinic|doctor|medical/i, category: 'health' },
];

export function keywordCategorize(merchantOrNote: string): string {
  const text = merchantOrNote.trim();
  if (!text) return 'other';

  for (const rule of KEYWORD_MAP) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return 'other';
}

export function normalizeCategoryName(name: string) {
  return name.trim().toLowerCase();
}

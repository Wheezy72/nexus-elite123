import { describe, expect, it } from 'vitest';
import { keywordCategorize } from '@/lib/financeCategorizer';

describe('financeCategorizer', () => {
  it('categorizes Safaricom as utilities', () => {
    expect(keywordCategorize('Safaricom airtime')).toBe('utilities');
  });

  it('categorizes Equity as banking', () => {
    expect(keywordCategorize('Equity bank')).toBe('banking');
  });

  it('falls back to other', () => {
    expect(keywordCategorize('Random Merchant XYZ')).toBe('other');
  });
});

import { describe, expect, it } from 'vitest';
import { parseMpesaSms } from '@/lib/mpesaSmsParser';

describe('mpesaSmsParser', () => {
  it('parses amount and merchant', () => {
    const msg = 'QW12ABCD34 Confirmed. Ksh250.00 paid to SAFARICOM LTD on 12/03/2026.';
    const tx = parseMpesaSms(msg);
    expect(tx).not.toBeNull();
    expect(tx!.amount).toBe(250);
    expect(tx!.currency).toBe('KES');
    expect(tx!.merchant.toLowerCase()).toContain('safaricom');
  });
});

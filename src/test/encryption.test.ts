import { describe, expect, it } from 'vitest';
import { decryptString, deriveAesKeyFromPin, encryptString } from '@/lib/encryption';

describe('encryption', () => {
  it('round trips a plaintext string', async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveAesKeyFromPin('1234', salt);

    const payload = await encryptString('hello world', key);
    const decrypted = await decryptString(payload, key);

    expect(decrypted).toBe('hello world');
  });
});

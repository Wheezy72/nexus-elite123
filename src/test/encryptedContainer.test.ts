import { describe, expect, it } from 'vitest';
import { decryptString, deriveKeyFromPin, encryptString } from '@/lib/encryption';
import { packEncryptedContainer, unpackEncryptedContainer } from '@/lib/encryptedContainer';

describe('encryptedContainer', () => {
  it('packs/unpacks and decrypts', async () => {
    const key = await deriveKeyFromPin('1234', crypto.getRandomValues(new Uint8Array(16)));
    const payload = await encryptString('hello', key);

    const bytes = packEncryptedContainer(payload, { contentType: 'text/plain' });
    const unpacked = unpackEncryptedContainer(bytes);

    expect(unpacked.header.alg).toBe('xchacha20-poly1305');
    expect(unpacked.header.contentType).toBe('text/plain');

    const plaintext = await decryptString(unpacked.payload, key);
    expect(plaintext).toBe('hello');
  });
});

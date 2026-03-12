import { fromBase64, toBase64, type EncryptedPayload } from '@/lib/encryption';

export interface EncryptedContainerHeader {
  alg: 'xchacha20-poly1305' | 'aes-256-gcm';
  nonceB64?: string;
  ivB64?: string;
  [k: string]: unknown;
}

export function packEncryptedContainer(payload: EncryptedPayload, extraHeader: Record<string, unknown> = {}) {
  const header: EncryptedContainerHeader = {
    alg: payload.alg === 'xchacha20-poly1305' ? 'xchacha20-poly1305' : 'aes-256-gcm',
    ...extraHeader,
  };

  if ('nonceB64' in payload) header.nonceB64 = payload.nonceB64;
  if ('ivB64' in payload) header.ivB64 = payload.ivB64;

  const headerStr = JSON.stringify(header);
  const headerBytes = new TextEncoder().encode(headerStr);
  const ciphertextBytes = fromBase64(payload.ciphertextB64);

  const out = new Uint8Array(2 + headerBytes.length + ciphertextBytes.length);
  out[0] = headerBytes.length >> 8;
  out[1] = headerBytes.length & 0xff;
  out.set(headerBytes, 2);
  out.set(ciphertextBytes, 2 + headerBytes.length);
  return out;
}

export function unpackEncryptedContainer(bytes: Uint8Array): { payload: EncryptedPayload; header: EncryptedContainerHeader } {
  if (bytes.length < 2) throw new Error('Invalid encrypted container');

  const headerLen = (bytes[0] << 8) | bytes[1];
  if (bytes.length < 2 + headerLen) throw new Error('Invalid encrypted container');

  const headerStr = new TextDecoder().decode(bytes.slice(2, 2 + headerLen));
  const header = JSON.parse(headerStr) as EncryptedContainerHeader;
  const ciphertext = bytes.slice(2 + headerLen);

  if (header.alg === 'xchacha20-poly1305') {
    if (!header.nonceB64) throw new Error('Invalid encrypted container');
    return {
      header,
      payload: {
        alg: 'xchacha20-poly1305',
        nonceB64: header.nonceB64,
        ciphertextB64: toBase64(ciphertext),
      },
    };
  }

  if (!header.ivB64) throw new Error('Invalid encrypted container');
  return {
    header,
    payload: {
      ivB64: header.ivB64,
      ciphertextB64: toBase64(ciphertext),
    },
  };
}

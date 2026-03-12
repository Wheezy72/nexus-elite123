import sodium from 'libsodium-wrappers-sumo';

const PBKDF2_ITERATIONS = 200_000;

export type EncryptedPayload =
  | { alg: 'xchacha20-poly1305'; nonceB64: string; ciphertextB64: string }
  | { alg?: 'aes-256-gcm'; ivB64: string; ciphertextB64: string };

let sodiumReady: Promise<typeof sodium> | null = null;
function getSodium() {
  if (!sodiumReady) {
    sodiumReady = (async () => {
      await sodium.ready;
      return sodium;
    })();
  }
  return sodiumReady;
}

export async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const pinKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
    'deriveBits',
  ]);

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    pinKey,
    256
  );

  return new Uint8Array(bits);
}

export async function encryptBytes(plaintext: Uint8Array, key: Uint8Array): Promise<EncryptedPayload> {
  const s = await getSodium();
  const nonce = crypto.getRandomValues(new Uint8Array(s.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES));

  const ciphertext = s.crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, null, null, nonce, key);

  return {
    alg: 'xchacha20-poly1305',
    nonceB64: toBase64(nonce),
    ciphertextB64: toBase64(ciphertext),
  };
}

export async function decryptBytes(payload: EncryptedPayload, key: Uint8Array): Promise<Uint8Array> {
  if ('ivB64' in payload) {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt']);
    const iv = fromBase64(payload.ivB64);
    const ciphertext = fromBase64(payload.ciphertextB64);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
    return new Uint8Array(plaintext);
  }

  const s = await getSodium();
  const nonce = fromBase64(payload.nonceB64);
  const ciphertext = fromBase64(payload.ciphertextB64);

  const plaintext = s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ciphertext, null, nonce, key);
  return new Uint8Array(plaintext);
}

export async function encryptString(plaintext: string, key: Uint8Array): Promise<EncryptedPayload> {
  return encryptBytes(new TextEncoder().encode(plaintext), key);
}

export async function decryptString(payload: EncryptedPayload, key: Uint8Array): Promise<string> {
  const bytes = await decryptBytes(payload, key);
  return new TextDecoder().decode(bytes);
}

export function toBase64(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function fromBase64(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

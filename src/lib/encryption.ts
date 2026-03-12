const PBKDF2_ITERATIONS = 200_000;

export interface EncryptedPayload {
  ivB64: string;
  ciphertextB64: string;
}

export async function deriveAesKeyFromPin(pin: string, salt: Uint8Array) {
  const pinKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    pinKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptString(plaintext: string, key: CryptoKey): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  return {
    ivB64: toBase64(iv),
    ciphertextB64: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptString(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  const iv = fromBase64(payload.ivB64);
  const ciphertext = fromBase64(payload.ciphertextB64);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
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

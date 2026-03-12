import { deriveAesKeyFromPin, decryptString, encryptString, fromBase64, toBase64, type EncryptedPayload } from '@/lib/encryption';

const PIN_STORAGE_KEY = 'nexus-pin-lock';
const VAULT_KEY_STORAGE_KEY = 'nexus-vault-key-b64';
const PIN_VERIFIER_TEXT = 'nexus-pin-verifier:v1';

interface PinLockRecord {
  saltB64: string;
  verifier: EncryptedPayload;
}

let vaultKey: CryptoKey | null = null;

function readRecord(): PinLockRecord | null {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.saltB64 !== 'string') return null;
    if (!parsed.verifier || typeof parsed.verifier !== 'object') return null;
    if (typeof parsed.verifier.ivB64 !== 'string') return null;
    if (typeof parsed.verifier.ciphertextB64 !== 'string') return null;
    return parsed as PinLockRecord;
  } catch {
    return null;
  }
}

function writeRecord(record: PinLockRecord) {
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(record));
}

async function exportKeyB64(key: CryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return toBase64(new Uint8Array(raw));
}

async function importKeyB64(b64: string) {
  const raw = fromBase64(b64);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

export const pinLockService = {
  hasPin() {
    return !!readRecord();
  },

  isUnlocked() {
    return vaultKey != null;
  },

  async unlock(pin: string) {
    const record = readRecord();
    if (!record) throw new Error('No PIN set');

    const key = await deriveAesKeyFromPin(pin, fromBase64(record.saltB64));
    const verifier = await decryptString(record.verifier, key);
    if (verifier !== PIN_VERIFIER_TEXT) throw new Error('Wrong PIN');

    vaultKey = key;
    sessionStorage.setItem(VAULT_KEY_STORAGE_KEY, await exportKeyB64(key));
  },

  async tryRestoreFromSession() {
    try {
      const b64 = sessionStorage.getItem(VAULT_KEY_STORAGE_KEY);
      if (!b64) return false;
      vaultKey = await importKeyB64(b64);
      return true;
    } catch {
      vaultKey = null;
      sessionStorage.removeItem(VAULT_KEY_STORAGE_KEY);
      return false;
    }
  },

  lock() {
    vaultKey = null;
    sessionStorage.removeItem(VAULT_KEY_STORAGE_KEY);
  },

  async setPin(pin: string) {
    if (!pin || pin.length < 4 || pin.length > 12) {
      throw new Error('PIN must be 4-12 digits');
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveAesKeyFromPin(pin, salt);
    const verifier = await encryptString(PIN_VERIFIER_TEXT, key);

    writeRecord({
      saltB64: toBase64(salt),
      verifier,
    });

    vaultKey = key;
    sessionStorage.setItem(VAULT_KEY_STORAGE_KEY, await exportKeyB64(key));
  },

  clearPin() {
    localStorage.removeItem(PIN_STORAGE_KEY);
    this.lock();
  },

  getVaultKey() {
    return vaultKey;
  },
};

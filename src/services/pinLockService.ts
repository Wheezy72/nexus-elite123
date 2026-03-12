import { decryptString, deriveKeyFromPin, encryptString, fromBase64, toBase64, type EncryptedPayload } from '@/lib/encryption';

const PIN_STORAGE_KEY = 'nexus-pin-lock';
const VAULT_KEY_STORAGE_KEY = 'nexus-vault-key-b64';
const PIN_VERIFIER_TEXT_V1 = 'nexus-pin-verifier:v1';
const PIN_VERIFIER_TEXT_V2 = 'nexus-pin-verifier:v2';

interface PinLockRecord {
  saltB64: string;
  verifier: EncryptedPayload;
}

let vaultKey: Uint8Array | null = null;

function readRecord(): PinLockRecord | null {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.saltB64 !== 'string') return null;
    if (!parsed.verifier || typeof parsed.verifier !== 'object') return null;

    const verifier = parsed.verifier as EncryptedPayload;
    if (typeof verifier.ciphertextB64 !== 'string') return null;
    if ('nonceB64' in verifier) {
      if (typeof verifier.nonceB64 !== 'string') return null;
      return parsed as PinLockRecord;
    }
    if ('ivB64' in verifier) {
      if (typeof verifier.ivB64 !== 'string') return null;
      return parsed as PinLockRecord;
    }

    return null;
  } catch {
    return null;
  }
}

function writeRecord(record: PinLockRecord) {
  localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(record));
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

    const key = await deriveKeyFromPin(pin, fromBase64(record.saltB64));
    const verifier = await decryptString(record.verifier, key);
    if (verifier !== PIN_VERIFIER_TEXT_V2 && verifier !== PIN_VERIFIER_TEXT_V1) throw new Error('Wrong PIN');

    vaultKey = key;
    sessionStorage.setItem(VAULT_KEY_STORAGE_KEY, toBase64(key));
  },

  async tryRestoreFromSession() {
    try {
      const b64 = sessionStorage.getItem(VAULT_KEY_STORAGE_KEY);
      if (!b64) return false;
      vaultKey = fromBase64(b64);
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
    const key = await deriveKeyFromPin(pin, salt);
    const verifier = await encryptString(PIN_VERIFIER_TEXT_V2, key);

    writeRecord({
      saltB64: toBase64(salt),
      verifier,
    });

    vaultKey = key;
    sessionStorage.setItem(VAULT_KEY_STORAGE_KEY, toBase64(key));
  },

  clearPin() {
    localStorage.removeItem(PIN_STORAGE_KEY);
    this.lock();
  },

  getVaultKey() {
    return vaultKey;
  },
};

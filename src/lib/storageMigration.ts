export function migrateLegacyStorageKeys() {
  try {
    const FLAG_KEY = 'future-migration-v1';
    if (localStorage.getItem(FLAG_KEY)) return;

    const old = String.fromCharCode(110, 101, 120, 117, 115); // previous brand prefix
    const oldWithDash = `${old}-`;
    const nextWithDash = 'future-';

    const keys = Object.keys(localStorage);

    for (const k of keys) {
      if (k.startsWith(oldWithDash)) {
        const next = `${nextWithDash}${k.slice(oldWithDash.length)}`;
        if (localStorage.getItem(next) == null) {
          const v = localStorage.getItem(k);
          if (v != null) localStorage.setItem(next, v);
        }
        localStorage.removeItem(k);
        continue;
      }

      if (k.startsWith(old) && !k.startsWith(oldWithDash)) {
        const next = `future${k.slice(old.length)}`;
        if (localStorage.getItem(next) == null) {
          const v = localStorage.getItem(k);
          if (v != null) localStorage.setItem(next, v);
        }
        localStorage.removeItem(k);
      }
    }

    const sessionKeys = Object.keys(sessionStorage);
    for (const k of sessionKeys) {
      if (k.startsWith(oldWithDash)) {
        const next = `${nextWithDash}${k.slice(oldWithDash.length)}`;
        if (sessionStorage.getItem(next) == null) {
          const v = sessionStorage.getItem(k);
          if (v != null) sessionStorage.setItem(next, v);
        }
        sessionStorage.removeItem(k);
        continue;
      }

      if (k.startsWith(old) && !k.startsWith(oldWithDash)) {
        const next = `future${k.slice(old.length)}`;
        if (sessionStorage.getItem(next) == null) {
          const v = sessionStorage.getItem(k);
          if (v != null) sessionStorage.setItem(next, v);
        }
        sessionStorage.removeItem(k);
      }
    }

    localStorage.setItem(FLAG_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

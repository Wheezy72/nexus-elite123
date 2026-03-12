import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import { pinLockService } from '@/services/pinLockService';
import { backupService } from '@/services/backupService';
import { notificationService } from '@/services/notificationService';

const PinGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [needsPin, setNeedsPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pinLockService.hasPin()) {
        setNeedsPin(false);
        setReady(true);
        return;
      }

      const restored = await pinLockService.tryRestoreFromSession();
      setNeedsPin(!restored);
      setReady(true);

      if (restored) {
        // Fire-and-forget; if buckets/policies aren't configured yet it will just no-op in practice.
        backupService.maybeAutoBackup();
      }
    })();
  }, []);

  const unlock = async () => {
    const trimmed = pin.trim();
    if (!trimmed) return;

    setUnlocking(true);
    setError(null);

    try {
      await pinLockService.unlock(trimmed);
      setNeedsPin(false);
      setPin('');
      backupService.maybeAutoBackup();
      notificationService.bootstrapDaily();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unlock');
    } finally {
      setUnlocking(false);
    }
  };

  if (!ready) return null;

  return (
    <>
      {children}
      <AnimatePresence>
        {needsPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="glass rounded-3xl border border-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.6)] w-[92%] max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/40 to-accent/30 border border-white/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Unlock Nexus</h2>
                  <p className="text-xs text-muted-foreground">Quick PIN unlock (your data stays on your device).</p>
                </div>
              </div>

              <label className="text-[11px] text-muted-foreground">PIN</label>
              <input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                onKeyDown={e => {
                  if (e.key === 'Enter') unlock();
                }}
                inputMode="numeric"
                autoFocus
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-3 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={unlock}
                disabled={unlocking || pin.trim().length < 4}
                className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {unlocking ? 'Unlocking…' : 'Unlock'}
              </motion.button>

              <div className="mt-4 flex items-start gap-2 text-[10px] text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 text-primary" />
                <p>
                  This is local app lock. For true zero‑knowledge sync we\'ll encrypt content before it touches the cloud.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PinGate;

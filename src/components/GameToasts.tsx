import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, X } from 'lucide-react';

interface ToastData {
  id: string;
  type: 'xp' | 'levelup' | 'achievement';
  message: string;
}

let addToastFn: ((toast: ToastData) => void) | null = null;

export function showGameToast(type: ToastData['type'], message: string) {
  addToastFn?.({ id: crypto.randomUUID(), type, message });
}

const GameToasts: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 3000);
    };
    return () => { addToastFn = null; };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`pointer-events-auto glass rounded-xl px-4 py-3 flex items-center gap-2.5 min-w-[200px] shadow-[0_8px_30px_rgba(0,0,0,0.3)] relative overflow-hidden ${
              toast.type === 'levelup'
                ? 'border border-amber-500/30'
                : toast.type === 'achievement'
                ? 'border border-primary/30'
                : 'border border-white/[0.08]'
            }`}
          >
            {(toast.type === 'levelup' || toast.type === 'achievement') && (
              <motion.div
                aria-hidden
                className={toast.type === 'levelup' ? 'absolute inset-0 bg-amber-500/10' : 'absolute inset-0 bg-primary/10'}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.35, 0] }}
                transition={{ duration: 0.9 }}
              />
            )}
            {toast.type === 'xp' && <Star className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'levelup' && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'achievement' && <Trophy className="w-4 h-4 text-primary shrink-0" />}
            <span className="text-xs font-medium text-foreground">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GameToasts;

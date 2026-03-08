import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves } from 'lucide-react';
import GlassCard from './GlassCard';

const PulseBreather: React.FC = () => {
  const [isPulsing, setIsPulsing] = useState(false);

  const trigger = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 2500);
  };

  return (
    <GlassCard className="p-6 flex flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-bold text-foreground tracking-tight">Pulse Reset</h2>
      <p className="text-xs text-muted-foreground text-center">Take a breath. Reset your focus.</p>

      <div className="relative w-32 h-32 flex items-center justify-center">
        <AnimatePresence>
          {isPulsing && (
            <>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, delay: i * 0.3, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border border-primary/40"
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          onClick={trigger}
          className="relative z-10 w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
        >
          <Waves className="w-6 h-6 text-primary" />
        </motion.button>
      </div>
    </GlassCard>
  );
};

export default PulseBreather;

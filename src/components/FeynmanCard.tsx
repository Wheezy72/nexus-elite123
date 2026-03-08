import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, BookOpen, Plus, Trash2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';
import { rewardAction } from '@/lib/rewards';

interface Reflection {
  id: string;
  front: string;
  back: string;
  createdAt: string;
}

const vaultStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const vaultItem = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const FeynmanCard: React.FC = () => {
  const [vault, setVault] = useLocalStorage<Reflection[]>('nexus-knowledge-vault', []);
  const [isFlipped, setIsFlipped] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [showVault, setShowVault] = useState(false);

  const save = () => {
    if (!front.trim() || !back.trim()) return;
    setVault(prev => [{
      id: crypto.randomUUID(),
      front: front.trim(),
      back: back.trim(),
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setFront('');
    setBack('');
    setIsFlipped(false);
  };

  const deleteReflection = (id: string) => {
    setVault(prev => prev.filter(r => r.id !== id));
  };

  return (
    <GlassCard className="p-6" tilt={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Feynman Flip</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowVault(!showVault)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Vault ({vault.length})
        </motion.button>
      </div>

      {!showVault ? (
        <div className="relative" style={{ perspective: 1000 }}>
          {/* Gradient border container */}
          <div className="relative rounded-xl p-[1px] overflow-hidden">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 animate-gradient-shift" />
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? 'back' : 'front'}
                initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ backfaceVisibility: 'hidden' }}
                className="glass rounded-xl p-5 min-h-[180px] flex flex-col relative z-10"
              >
                {!isFlipped ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Reflect on what you just learned</p>
                    <textarea
                      value={front}
                      onChange={e => setFront(e.target.value)}
                      placeholder="What concept are you exploring?"
                      className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">Explain it like I'm five</p>
                    <textarea
                      value={back}
                      onChange={e => setBack(e.target.value)}
                      placeholder="Use simple words, analogies, stories..."
                      className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex gap-2 mt-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex-1 py-2 rounded-xl glass text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Flip
            </motion.button>
            {isFlipped && front && back && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={save}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save
              </motion.button>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          variants={vaultStagger}
          initial="hidden"
          animate="show"
          className="space-y-2 max-h-[250px] overflow-y-auto"
        >
          {vault.length === 0 ? (
            <EmptyState icon={BookOpen} title="Vault is empty" description="Create your first Feynman reflection" />
          ) : vault.map(r => (
            <motion.div
              key={r.id}
              variants={vaultItem}
              layout
              className="glass rounded-xl p-3 group relative border-l-2 border-l-accent/30 hover:border-l-accent/60 transition-colors"
            >
              <button
                onClick={() => deleteReflection(r.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
              <p className="text-xs font-medium text-foreground mb-1 pr-5">{r.front}</p>
              <p className="text-xs text-muted-foreground">{r.back}</p>
              <span className="text-[10px] text-muted-foreground/50 mt-1 block">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </GlassCard>
  );
};

export default FeynmanCard;

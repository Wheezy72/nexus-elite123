import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, BookOpen, Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface Reflection {
  id: string;
  front: string;
  back: string;
  createdAt: string;
}

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
          <AnimatePresence mode="wait">
            <motion.div
              key={isFlipped ? 'back' : 'front'}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass rounded-xl p-5 min-h-[180px] flex flex-col"
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

          <div className="flex gap-2 mt-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex-1 py-2 rounded-xl glass text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
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
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {vault.length === 0 ? (
            <EmptyState icon={BookOpen} title="Vault is empty" description="Create your first Feynman reflection" />
          ) : vault.map(r => (
            <div key={r.id} className="glass rounded-xl p-3">
              <p className="text-xs font-medium text-foreground mb-1">{r.front}</p>
              <p className="text-xs text-muted-foreground">{r.back}</p>
              <span className="text-[10px] text-muted-foreground/50 mt-1 block">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default FeynmanCard;

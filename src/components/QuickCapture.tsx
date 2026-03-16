import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { haptic } from '@/lib/haptics';
import { rewardAction } from '@/lib/rewards';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const QuickCapture: React.FC = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>('future-notes', []);
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    haptic('success');
    
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: input.trim().slice(0, 50),
      content: input.trim(),
      category: 'Ideas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes(prev => [newNote, ...prev]);
    setInput('');
    setIsExpanded(false);
    rewardAction('task_create'); // Reuse XP action
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-premium rounded-2xl p-4 mb-4"
    >
      <div className="flex items-center gap-3">
        <Zap className="w-5 h-5 text-amber-400 shrink-0" />
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Quick capture an idea..."
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
        />
        {input.trim() && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSubmit}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>
      
      {isExpanded && !input.trim() && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-muted-foreground mt-2"
        >
          Press Enter to save as a new note
        </motion.p>
      )}
    </motion.div>
  );
};

export default QuickCapture;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Heart, Quote } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import { haptic } from '@/lib/haptics';
import { rewardAction } from '@/lib/rewards';

const WRITING_PROMPTS = [
  "What's one thing you're proud of today?",
  "Describe a moment that made you smile recently.",
  "What would you tell your past self from a year ago?",
  "What's a challenge you overcame this week?",
  "What does your ideal day look like?",
  "Write about something you're curious about.",
  "What's a lesson you learned the hard way?",
  "Describe a place where you feel most at peace.",
  "What are 3 things you're grateful for right now?",
  "If you could master any skill overnight, what would it be?",
  "What's something small that brings you joy?",
  "Write a letter to your future self.",
  "What's a fear you'd like to overcome?",
  "Describe your happiest memory in detail.",
  "What does success mean to you personally?",
];

const AFFIRMATIONS = [
  "I am capable of achieving great things.",
  "My potential is limitless.",
  "I choose progress over perfection.",
  "I am worthy of good things.",
  "Today I choose to be kind to myself.",
  "I trust the timing of my life.",
  "I am growing stronger every day.",
  "My creativity flows freely.",
  "I embrace change and welcome growth.",
  "I am enough, exactly as I am.",
];

interface GratitudeEntry {
  id: string;
  items: string[];
  date: string;
}

const JournalExtras: React.FC = () => {
  const [gratitudes, setGratitudes] = useLocalStorage<GratitudeEntry[]>('nexus-gratitude', []);
  const [gratitudeInput, setGratitudeInput] = useState(['', '', '']);
  const [prompt, setPrompt] = useState(() => WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]);
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const [showGratitudeHistory, setShowGratitudeHistory] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayEntry = gratitudes.find(g => g.date === todayKey);

  const shufflePrompt = () => {
    haptic('light');
    setPrompt(WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]);
  };

  const saveGratitude = () => {
    const items = gratitudeInput.filter(i => i.trim());
    if (items.length === 0) return;
    haptic('success');
    rewardAction('gratitude_log');
    setGratitudes(prev => {
      const filtered = prev.filter(g => g.date !== todayKey);
      return [{ id: crypto.randomUUID(), items, date: todayKey }, ...filtered];
    });
    setGratitudeInput(['', '', '']);
  };

  return (
    <div className="space-y-4">
      {/* Daily Affirmation */}
      <GlassCard className="p-5" tilt={false}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">Daily Affirmation</h3>
        </div>
        <p className="text-sm text-foreground/80 italic leading-relaxed">"{affirmation}"</p>
      </GlassCard>

      {/* Writing Prompt */}
      <GlassCard className="p-5" tilt={false}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Writing Prompt</h3>
          </div>
          <motion.button
            whileTap={{ scale: 0.85, rotate: 180 }}
            onClick={shufflePrompt}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </motion.button>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{prompt}</p>
        <p className="text-[10px] text-muted-foreground/50 mt-2">Use this as inspiration for your Brain Dump</p>
      </GlassCard>

      {/* Gratitude Journal */}
      <GlassCard className="p-5" tilt={false}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-foreground">Gratitude</h3>
          </div>
          {gratitudes.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowGratitudeHistory(!showGratitudeHistory)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              History ({gratitudes.length})
            </motion.button>
          )}
        </div>

        {todayEntry ? (
          <div className="space-y-1.5">
            <p className="text-[10px] text-emerald-400 font-medium mb-2">Today's gratitude logged</p>
            {todayEntry.items.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-primary/60 mt-0.5">{i + 1}.</span>
                <p className="text-xs text-foreground/80">{item}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/40 w-3">{i + 1}.</span>
                <input
                  value={gratitudeInput[i]}
                  onChange={e => {
                    const next = [...gratitudeInput];
                    next[i] = e.target.value;
                    setGratitudeInput(next);
                  }}
                  placeholder="I'm grateful for..."
                  className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
            ))}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={saveGratitude}
              disabled={!gratitudeInput.some(i => i.trim())}
              className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-30 mt-1"
            >
              Save Gratitude
            </motion.button>
          </div>
        )}

        {/* History */}
        <AnimatePresence>
          {showGratitudeHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="space-y-2 max-h-[150px] overflow-y-auto border-t border-white/[0.06] pt-2">
                {gratitudes.slice(0, 10).map((g, idx) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass rounded-lg p-2"
                  >
                    <p className="text-[9px] text-muted-foreground/50 mb-1">
                      {new Date(g.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                    {g.items.map((item, i) => (
                      <p key={i} className="text-[10px] text-foreground/70">{item}</p>
                    ))}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};

export default JournalExtras;

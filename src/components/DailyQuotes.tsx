import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart, RefreshCw, Quote } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Your mind is a garden, your thoughts are the seeds.", author: "Unknown" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "We become what we think about most of the time.", author: "Earl Nightingale" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
];

function getDayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000) % QUOTES.length;
}

const DailyQuotes: React.FC = () => {
  const [favorites, setFavorites] = useLocalStorage<number[]>('nexus-fav-quotes', []);
  const [extraIndex, setExtraIndex] = useLocalStorage<number | null>('nexus-quote-extra', null);

  const index = extraIndex !== null ? extraIndex : getDayIndex();
  const quote = QUOTES[index];
  const isFav = favorites.includes(index);

  const toggleFav = () => {
    setFavorites(prev => isFav ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const shuffle = () => {
    let next = Math.floor(Math.random() * QUOTES.length);
    while (next === index) next = Math.floor(Math.random() * QUOTES.length);
    setExtraIndex(next);
  };

  return (
    <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
      <Quote className="w-5 h-5 text-primary/40 mb-3" />
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm font-medium text-foreground leading-relaxed mb-2 max-w-[260px]"
      >
        "{quote.text}"
      </motion.p>
      <p className="text-[11px] text-muted-foreground mb-4">— {quote.author}</p>
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={toggleFav}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isFav ? 'bg-pink-500/20 text-pink-400' : 'glass text-muted-foreground hover:text-foreground'}`}
        >
          <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85, rotate: 180 }}
          onClick={shuffle}
          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>
    </GlassCard>
  );
};

export default DailyQuotes;

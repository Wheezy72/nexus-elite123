import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Lightbulb, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { haptic } from '@/lib/haptics';
import GlassCard from './GlassCard';

interface SleepEntry {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  duration: number;
}

const TIPS = [
  { condition: 'low_duration', tip: 'Try going to bed 30 minutes earlier tonight', icon: '🌙' },
  { condition: 'late_bedtime', tip: 'A consistent bedtime improves sleep quality', icon: '⏰' },
  { condition: 'low_quality', tip: 'Avoid screens 1 hour before bed', icon: '📱' },
  { condition: 'general', tip: 'Keep your bedroom cool (65-68°F) for optimal sleep', icon: '❄️' },
  { condition: 'general', tip: 'Limit caffeine after 2 PM for better rest', icon: '☕' },
  { condition: 'general', tip: 'Try a relaxing bedtime routine like reading', icon: '📚' },
  { condition: 'general', tip: 'Expose yourself to natural light in the morning', icon: '☀️' },
  { condition: 'general', tip: 'Exercise regularly, but not too close to bedtime', icon: '🏃' },
  { condition: 'good', tip: 'Great job maintaining healthy sleep habits!', icon: '🌟' },
];

const SleepTips: React.FC = () => {
  const [entries] = useLocalStorage<SleepEntry[]>('future-sleep-log', []);
  const [tipIndex, setTipIndex] = useState(0);

  // Calculate averages from last 7 entries
  const recent = entries.slice(0, 7);
  const avgDuration = recent.length > 0
    ? recent.reduce((s, e) => s + e.duration, 0) / recent.length
    : 0;
  const avgQuality = recent.length > 0
    ? recent.reduce((s, e) => s + e.quality, 0) / recent.length
    : 0;

  // Determine relevant tips
  const getRelevantTips = () => {
    const relevant: typeof TIPS = [];
    
    if (avgDuration < 7 * 60) {
      relevant.push(...TIPS.filter(t => t.condition === 'low_duration'));
    }
    if (avgQuality < 3) {
      relevant.push(...TIPS.filter(t => t.condition === 'low_quality'));
    }
    if (avgDuration >= 7 * 60 && avgQuality >= 4) {
      relevant.push(...TIPS.filter(t => t.condition === 'good'));
    }
    
    relevant.push(...TIPS.filter(t => t.condition === 'general'));
    return relevant;
  };

  const tips = getRelevantTips();
  const currentTip = tips[tipIndex % tips.length];

  const nextTip = () => {
    haptic('light');
    setTipIndex(prev => prev + 1);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => prev + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Sleep Tips
        </h3>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={nextTip}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>

      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="glass rounded-xl p-4 flex items-start gap-3"
      >
        <span className="text-2xl">{currentTip?.icon}</span>
        <p className="text-sm text-foreground/90 leading-relaxed">{currentTip?.tip}</p>
      </motion.div>

      {recent.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="glass rounded-lg p-3 text-center">
            <Moon className="w-4 h-4 mx-auto mb-1 text-primary/60" />
            <p className="text-sm font-medium text-foreground">
              {Math.floor(avgDuration / 60)}h {Math.round(avgDuration % 60)}m
            </p>
            <p className="text-[9px] text-muted-foreground">Avg sleep</p>
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <span className="text-lg block mb-0.5">
              {avgQuality >= 4 ? '😴' : avgQuality >= 3 ? '😐' : '😓'}
            </span>
            <p className="text-sm font-medium text-foreground">{avgQuality.toFixed(1)}/5</p>
            <p className="text-[9px] text-muted-foreground">Avg quality</p>
          </div>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-3">
        {tips.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              (tipIndex % tips.length) === i ? 'bg-primary' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </GlassCard>
  );
};

export default SleepTips;

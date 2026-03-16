import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Clock, RefreshCw, Lightbulb } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { haptic } from '@/lib/haptics';
import GlassCard from './GlassCard';

const TIPS = [
  { tip: 'Drink a glass of water first thing in the morning', icon: '🌅' },
  { tip: 'Carry a reusable water bottle with you', icon: '🧴' },
  { tip: 'Set reminders on your phone to drink water', icon: '⏰' },
  { tip: 'Infuse water with fruits for natural flavor', icon: '🍋' },
  { tip: 'Drink a glass before each meal', icon: '🍽️' },
  { tip: 'Match each cup of coffee with a glass of water', icon: '☕' },
  { tip: 'Track your intake to stay accountable', icon: '📊' },
  { tip: 'Eat water-rich foods like cucumbers and watermelon', icon: '🥒' },
];

const HydrationTips: React.FC = () => {
  const todayKey = new Date().toISOString().split('T')[0];
  const [log] = useLocalStorage<Record<string, number>>('future-water-log', {});
  const [lastDrinkTime, setLastDrinkTime] = useLocalStorage<string | null>('future-last-drink', null);
  const [tipIndex, setTipIndex] = useState(0);
  const [timeSince, setTimeSince] = useState<string>('');

  const current = log[todayKey] || 0;
  const currentTip = TIPS[tipIndex % TIPS.length];

  const nextTip = () => {
    haptic('light');
    setTipIndex(prev => prev + 1);
  };

  // Update time since last drink
  useEffect(() => {
    const updateTime = () => {
      if (!lastDrinkTime) {
        setTimeSince('No drinks logged yet');
        return;
      }
      const last = new Date(lastDrinkTime);
      const now = new Date();
      const diffMs = now.getTime() - last.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        setTimeSince('Just now');
      } else if (diffMins < 60) {
        setTimeSince(`${diffMins}m ago`);
      } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTimeSince(`${hours}h ${mins}m ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [lastDrinkTime]);

  // Track when water is added
  useEffect(() => {
    const prevValue = log[todayKey] || 0;
    if (current > prevValue) {
      setLastDrinkTime(new Date().toISOString());
    }
  }, [current]);

  const needsReminder = () => {
    if (!lastDrinkTime) return true;
    const last = new Date(lastDrinkTime);
    const now = new Date();
    return (now.getTime() - last.getTime()) > 90 * 60 * 1000; // 90 minutes
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Hydration Tips
        </h3>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={nextTip}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Time since last drink */}
      <motion.div
        animate={needsReminder() ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: needsReminder() ? Infinity : 0, duration: 2 }}
        className={`glass rounded-xl p-4 mb-4 flex items-center gap-3 ${
          needsReminder() ? 'border border-amber-500/30 bg-amber-500/5' : ''
        }`}
      >
        <Clock className={`w-5 h-5 ${needsReminder() ? 'text-amber-400' : 'text-primary'}`} />
        <div>
          <p className="text-[10px] text-muted-foreground">Last drink</p>
          <p className={`text-sm font-medium ${needsReminder() ? 'text-amber-400' : 'text-foreground'}`}>
            {timeSince}
          </p>
        </div>
        {needsReminder() && (
          <Droplets className="w-5 h-5 text-primary ml-auto animate-pulse" />
        )}
      </motion.div>

      {/* Tip card */}
      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 flex items-start gap-3"
      >
        <span className="text-2xl">{currentTip.icon}</span>
        <p className="text-sm text-foreground/90 leading-relaxed">{currentTip.tip}</p>
      </motion.div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 mt-4">
        {TIPS.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              (tipIndex % TIPS.length) === i ? 'bg-primary' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </GlassCard>
  );
};

export default HydrationTips;

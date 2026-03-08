import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

interface SleepEntry {
  id: string;
  date: string;
  duration: number; // minutes
}

const TARGET_SLEEP = 8 * 60; // 8 hours in minutes

const SleepDebt: React.FC = () => {
  const [entries] = useLocalStorage<SleepEntry[]>('nexus-sleep-log', []);

  // Get last 7 days
  const last7Keys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const weekData = last7Keys.map(key => {
    const entry = entries.find(e => e.date === key);
    const duration = entry?.duration || 0;
    const diff = duration - TARGET_SLEEP;
    return {
      day: new Date(key).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2),
      duration,
      diff,
      hasData: !!entry,
    };
  });

  const totalDebt = weekData.reduce((sum, d) => sum + (d.hasData ? d.diff : 0), 0);
  const daysWithData = weekData.filter(d => d.hasData).length;
  const avgSleep = daysWithData > 0
    ? weekData.filter(d => d.hasData).reduce((s, d) => s + d.duration, 0) / daysWithData
    : 0;

  const isInDebt = totalDebt < 0;
  const debtHours = Math.abs(Math.round(totalDebt / 60 * 10) / 10);
  const avgHours = Math.floor(avgSleep / 60);
  const avgMins = Math.round(avgSleep % 60);

  return (
    <GlassCard className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Sleep Debt Calculator
      </h3>

      {/* Main debt display */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`glass rounded-2xl p-5 text-center mb-4 ${
          isInDebt ? 'border border-red-500/20' : 'border border-emerald-500/20'
        }`}
      >
        {isInDebt ? (
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400" />
        ) : (
          <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
        )}
        <p className={`text-3xl font-bold ${isInDebt ? 'text-red-400' : 'text-emerald-400'}`}>
          {isInDebt ? '-' : '+'}{debtHours}h
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {isInDebt ? 'Sleep debt this week' : 'Extra sleep this week'}
        </p>
      </motion.div>

      {/* Weekly bars */}
      <div className="flex items-end justify-between h-20 mb-2">
        {weekData.map((d, i) => {
          const height = d.hasData ? Math.min(Math.max((d.duration / TARGET_SLEEP) * 100, 10), 100) : 10;
          const isDeficit = d.diff < 0;
          return (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.05 }}
              className={`w-[12%] rounded-t-md ${
                d.hasData
                  ? isDeficit ? 'bg-red-500/40' : 'bg-emerald-500/40'
                  : 'bg-white/10'
              }`}
              title={d.hasData ? `${Math.floor(d.duration / 60)}h ${d.duration % 60}m` : 'No data'}
            />
          );
        })}
      </div>
      <div className="flex justify-between">
        {weekData.map((d, i) => (
          <span key={i} className="text-[9px] text-muted-foreground w-[12%] text-center">
            {d.day}
          </span>
        ))}
      </div>

      {/* 8h target line indicator */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <div className="h-px w-8 bg-white/20" />
        <span>8h target</span>
        <div className="h-px w-8 bg-white/20" />
      </div>

      {/* Average */}
      {daysWithData > 0 && (
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          Averaging <span className="text-foreground font-medium">{avgHours}h {avgMins}m</span> per night
        </p>
      )}
    </GlassCard>
  );
};

export default SleepDebt;

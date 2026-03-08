import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { startAudio, stopAudio, updateAudio, getIsPlaying } from '@/lib/audioEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

interface FlowSession {
  id: string;
  startedAt: string;
  duration: number; // seconds completed
  type: 'focus' | 'break';
}

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const FlowEngine: React.FC = () => {
  const [sessions, setSessions] = useLocalStorage<FlowSession[]>('nexus-flow-sessions', []);
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocus, setIsFocus] = useState(true);
  const [density, setDensity] = useState(50);
  const [tone, setTone] = useState(50);
  const [audioOn, setAudioOn] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const sessionStart = useRef<number>(0);

  const totalTime = isFocus ? FOCUS_TIME : BREAK_TIME;
  const progress = 1 - timeLeft / totalTime;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    sessionStart.current = Date.now();
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(isFocus ? FOCUS_TIME : BREAK_TIME);
  }, [isFocus]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const elapsed = Math.round((Date.now() - sessionStart.current) / 1000);
          setSessions(s => [...s, {
            id: crypto.randomUUID(),
            startedAt: new Date().toISOString(),
            duration: elapsed,
            type: isFocus ? 'focus' : 'break',
          }]);
          setIsRunning(false);
          const next = !isFocus;
          setIsFocus(!isFocus);
          return next ? FOCUS_TIME : BREAK_TIME;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isFocus, setSessions]);

  const toggleAudio = () => {
    if (audioOn) { stopAudio(); setAudioOn(false); }
    else { startAudio(density, tone); setAudioOn(true); }
  };

  useEffect(() => {
    if (audioOn) updateAudio(density, tone);
  }, [density, tone, audioOn]);

  useEffect(() => () => { if (getIsPlaying()) stopAudio(); }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <GlassCard className="p-6 flex flex-col items-center gap-5 relative">
      {/* Breathing gradient overlay */}
      {isRunning && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent breathing-active pointer-events-none" />
      )}

      <div className="flex items-center gap-2 w-full">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Flow Engine</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isFocus ? 'bg-primary/20 text-primary' : 'bg-accent text-accent-foreground'}`}>
          {isFocus ? 'Focus' : 'Break'}
        </span>
      </div>

      {/* Circular SVG timer */}
      <div className="relative w-[200px] h-[200px]">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle
            cx="100" cy="100" r={radius} fill="none"
            stroke="hsl(226, 70%, 55.5%)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums text-foreground">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {sessions.filter(s => s.type === 'focus').length} sessions today
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          onClick={isRunning ? pauseTimer : startTimer}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={resetTimer}
          className="w-12 h-12 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={toggleAudio}
          className={`w-12 h-12 rounded-full glass flex items-center justify-center transition-colors ${audioOn ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Volume2 className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Audio sliders */}
      {audioOn && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="w-full space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Rain Density</span>
            <span className="text-xs tabular-nums text-foreground">{density}%</span>
          </div>
          <Slider value={[density]} onValueChange={([v]) => setDensity(v)} min={0} max={100} step={1} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tone</span>
            <span className="text-xs tabular-nums text-foreground">{tone}%</span>
          </div>
          <Slider value={[tone]} onValueChange={([v]) => setTone(v)} min={0} max={100} step={1} />
        </motion.div>
      )}
    </GlassCard>
  );
};

export default FlowEngine;

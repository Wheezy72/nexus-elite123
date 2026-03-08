import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings, Upload, X, CloudRain, Wind, Trees, Radio, Music, Bell } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { startAudio, stopAudio, updateAudio, pauseAudio, resumeAudio, getIsPlaying, type AudioConfig, type NoiseType } from '@/lib/audioEngine';
import { requestNotificationPermission, sendTimerNotification, setTabBadge, resetTabTitle, playAlertChime, playWarningTick } from '@/lib/timerNotifications';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';

interface FlowSession {
  id: string;
  startedAt: string;
  duration: number;
  type: 'focus' | 'break';
}

interface CustomChannelAudio {
  name: string;
  url: string;
  channel: NoiseType;
}

const PRESETS = [
  { label: '15 min', focus: 15, break: 3 },
  { label: '25 min', focus: 25, break: 5 },
  { label: '45 min', focus: 45, break: 10 },
  { label: '60 min', focus: 60, break: 15 },
];

const noiseChannels: { key: NoiseType; label: string; icon: React.ElementType }[] = [
  { key: 'brown', label: 'Brown', icon: Radio },
  { key: 'white', label: 'White', icon: Wind },
  { key: 'green', label: 'Green', icon: Trees },
  { key: 'rain', label: 'Rain', icon: CloudRain },
];

const FlowEngine: React.FC = () => {
  const [sessions, setSessions] = useLocalStorage<FlowSession[]>('nexus-flow-sessions', []);
  const [focusMin, setFocusMin] = useLocalStorage<number>('nexus-focus-min', 25);
  const [breakMin, setBreakMin] = useLocalStorage<number>('nexus-break-min', 5);

  const [timeLeft, setTimeLeft] = useState(focusMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocus, setIsFocus] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  // Audio config
  const [noiseVolumes, setNoiseVolumes] = useLocalStorage<Record<NoiseType, number>>('nexus-noise-vols', {
    brown: 50, white: 0, green: 0, rain: 40,
  });
  const [tone, setTone] = useLocalStorage<number>('nexus-tone', 50);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [customVolume, setCustomVolume] = useLocalStorage<number>('nexus-custom-vol', 50);
  const [audioOn, setAudioOn] = useState(false);
  const [notificationsOn, setNotificationsOn] = useLocalStorage<boolean>('nexus-notif-on', true);

  // Custom audio per channel
  const [uploadChannel, setUploadChannel] = useState<NoiseType | 'custom'>('custom');

  const intervalRef = useRef<number | null>(null);
  const sessionStart = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const warningFiredRef = useRef(false);

  const totalTime = (isFocus ? focusMin : breakMin) * 60;
  const progress = 1 - timeLeft / totalTime;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  const getAudioConfig = useCallback((): AudioConfig => ({
    noiseVolumes,
    tone,
    customAudioUrl,
    customVolume,
  }), [noiseVolumes, tone, customAudioUrl, customVolume]);

  useEffect(() => {
    if (audioOn && getIsPlaying()) updateAudio(getAudioConfig());
  }, [noiseVolumes, tone, customVolume, audioOn, getAudioConfig]);

  useEffect(() => {
    if (!audioOn) return;
    if (isRunning) {
      if (getIsPlaying()) resumeAudio();
      else startAudio(getAudioConfig());
    } else {
      pauseAudio();
    }
  }, [isRunning, audioOn, getAudioConfig]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    sessionStart.current = Date.now();
    warningFiredRef.current = false;
    resetTabTitle();
    if (notificationsOn) requestNotificationPermission();
  }, [notificationsOn]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    warningFiredRef.current = false;
    resetTabTitle();
    setTimeLeft((isFocus ? focusMin : breakMin) * 60);
  }, [isFocus, focusMin, breakMin]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft((isFocus ? focusMin : breakMin) * 60);
    }
  }, [focusMin, breakMin, isFocus, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        // Warning at 60s remaining
        if (prev === 61 && !warningFiredRef.current && notificationsOn) {
          warningFiredRef.current = true;
          playWarningTick();
          setTabBadge(true, isFocus ? 'Focus ending' : 'Break ending');
          sendTimerNotification(
            isFocus ? '⏰ Focus ending soon!' : '☕ Break ending soon!',
            'One minute remaining — wrap up!'
          );
        }

        if (prev <= 1) {
          const elapsed = Math.round((Date.now() - sessionStart.current) / 1000);
          setSessions(s => [...s, {
            id: crypto.randomUUID(),
            startedAt: new Date().toISOString(),
            duration: elapsed,
            type: isFocus ? 'focus' : 'break',
          }]);
          
          // Completion notification + chime
          if (notificationsOn) {
            playAlertChime();
            sendTimerNotification(
              isFocus ? '✅ Focus session complete!' : '🎉 Break over!',
              isFocus ? 'Time for a break.' : 'Back to focus!'
            );
            setTabBadge(true, isFocus ? 'Session done' : 'Break done');
            // Clear badge after 5s
            setTimeout(() => resetTabTitle(), 5000);
          }

          setIsRunning(false);
          warningFiredRef.current = false;
          const nextIsFocus = !isFocus;
          setIsFocus(nextIsFocus);
          return (nextIsFocus ? focusMin : breakMin) * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isFocus, setSessions, focusMin, breakMin, notificationsOn]);

  const toggleAudio = () => {
    if (audioOn) {
      stopAudio();
      setAudioOn(false);
    } else {
      startAudio(getAudioConfig());
      setAudioOn(true);
      if (!isRunning) pauseAudio();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioName(file.name);
    if (audioOn) {
      stopAudio();
      setTimeout(() => startAudio({ ...getAudioConfig(), customAudioUrl: url }), 100);
    }
  };

  const removeCustomAudio = () => {
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    setCustomAudioUrl(null);
    setCustomAudioName(null);
    if (audioOn) {
      stopAudio();
      startAudio({ ...getAudioConfig(), customAudioUrl: null });
    }
  };

  useEffect(() => () => {
    if (getIsPlaying()) stopAudio();
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const setNoiseVol = (key: NoiseType, val: number) => {
    setNoiseVolumes(prev => ({ ...prev, [key]: val }));
  };

  return (
    <GlassCard className="p-4 sm:p-6 flex flex-col items-center gap-4 relative">
      {isRunning && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent breathing-active pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Flow Engine</h2>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isFocus ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
            {isFocus ? 'Focus' : 'Break'}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showSettings ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="glass rounded-xl p-3 sm:p-4 space-y-3">
              <p className="text-xs font-medium text-foreground">Timer Presets</p>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {PRESETS.map(p => (
                  <motion.button
                    key={p.label}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { setFocusMin(p.focus); setBreakMin(p.break); }}
                    className={`text-[11px] sm:text-xs py-2 rounded-lg transition-colors ${focusMin === p.focus ? 'bg-primary/20 text-primary font-semibold' : 'glass text-muted-foreground hover:text-foreground'}`}
                  >
                    {p.label}
                  </motion.button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Focus (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={focusMin}
                    onChange={e => setFocusMin(Math.max(1, Math.min(120, Number(e.target.value))))}
                    className="w-full glass rounded-lg px-3 py-1.5 text-sm text-foreground bg-transparent outline-none tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Break (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={breakMin}
                    onChange={e => setBreakMin(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-full glass rounded-lg px-3 py-1.5 text-sm text-foreground bg-transparent outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circular SVG timer */}
      <div className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <motion.circle
            cx="100" cy="100" r={radius} fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-bold tabular-nums text-foreground">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
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
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]"
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
          {audioOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Audio mixer toggle */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAudio(!showAudio)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showAudio ? 'Hide Mixer' : 'Sound Mixer ↓'}
      </motion.button>

      <AnimatePresence>
        {showAudio && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="space-y-3">
              {/* Noise channels */}
              {noiseChannels.map(ch => (
                <div key={ch.key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ch.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{ch.label}</span>
                    </div>
                    <span className="text-[10px] tabular-nums text-foreground">{noiseVolumes[ch.key]}%</span>
                  </div>
                  <Slider
                    value={[noiseVolumes[ch.key]]}
                    onValueChange={([v]) => setNoiseVol(ch.key, v)}
                    min={0} max={100} step={1}
                  />
                </div>
              ))}

              {/* Tone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tone Filter</span>
                  <span className="text-[10px] tabular-nums text-foreground">{tone}%</span>
                </div>
                <Slider value={[tone]} onValueChange={([v]) => setTone(v)} min={0} max={100} step={1} />
              </div>

              {/* Custom audio upload with channel selector */}
              <div className="glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Your Audio</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/20 text-primary flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload
                  </motion.button>
                </div>

                {/* Channel selector */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {[...noiseChannels.map(c => ({ key: c.key, label: c.label })), { key: 'custom' as const, label: 'Custom' }].map(ch => (
                    <motion.button
                      key={ch.key}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setUploadChannel(ch.key as NoiseType | 'custom')}
                      className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${
                        uploadChannel === ch.key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {ch.label}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground mb-2">
                  Upload to: <span className="text-primary font-medium">{uploadChannel === 'custom' ? 'Custom layer' : `${uploadChannel} channel`}</span>
                </p>

                {customAudioName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground truncate max-w-[120px] sm:max-w-[140px]">{customAudioName}</span>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[customVolume]}
                        onValueChange={([v]) => setCustomVolume(v)}
                        min={0} max={100} step={1}
                        className="w-14 sm:w-16"
                      />
                      <motion.button whileTap={{ scale: 0.9 }} onClick={removeCustomAudio}>
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Upload an MP3 or WAV to layer with the noise</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

export default FlowEngine;

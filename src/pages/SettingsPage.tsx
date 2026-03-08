import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Eye, EyeOff, Palette, Layers, RotateCcw, Video, Sparkles, Grid3X3 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';

const accentColors = [
  { name: 'Indigo', hsl: '226 70% 55.5%', preview: 'bg-indigo-500' },
  { name: 'Violet', hsl: '270 70% 55%', preview: 'bg-violet-500' },
  { name: 'Cyan', hsl: '190 80% 50%', preview: 'bg-cyan-500' },
  { name: 'Rose', hsl: '350 70% 55%', preview: 'bg-rose-500' },
  { name: 'Emerald', hsl: '160 70% 45%', preview: 'bg-emerald-500' },
];

const SettingsPage: React.FC = () => {
  const [videoBg, setVideoBg] = useLocalStorage<string | null>('nexus-video-bg', null);
  const [videoEnabled, setVideoEnabled] = useLocalStorage<boolean>('nexus-video-enabled', true);
  const [videoOpacity, setVideoOpacity] = useLocalStorage<number>('nexus-video-opacity', 15);
  const [accentColor, setAccentColor] = useLocalStorage<string>('nexus-accent-color', '226 70% 55.5%');
  const [showNoise, setShowNoise] = useLocalStorage<boolean>('nexus-show-noise', true);
  const [showGrid, setShowGrid] = useLocalStorage<boolean>('nexus-show-grid', true);
  const [showBlobs, setShowBlobs] = useLocalStorage<boolean>('nexus-show-blobs', true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setVideoBg(reader.result as string);
      setVideoEnabled(true);
    };
    reader.readAsDataURL(file);
  };

  const applyAccent = (hsl: string) => {
    setAccentColor(hsl);
    document.documentElement.style.setProperty('--primary', hsl);
    document.documentElement.style.setProperty('--ring', hsl);
    document.documentElement.style.setProperty('--sidebar-primary', hsl);
    document.documentElement.style.setProperty('--sidebar-ring', hsl);
  };

  const resetAll = () => {
    if (!confirm('This will clear ALL app data. Are you sure?')) return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith('nexus-'));
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  React.useEffect(() => {
    if (accentColor !== '226 70% 55.5%') {
      document.documentElement.style.setProperty('--primary', accentColor);
      document.documentElement.style.setProperty('--ring', accentColor);
    }
  }, [accentColor]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-noise', showNoise ? '1' : '0');
    document.documentElement.setAttribute('data-grid', showGrid ? '1' : '0');
    document.documentElement.setAttribute('data-blobs', showBlobs ? '1' : '0');
  }, [showNoise, showGrid, showBlobs]);

  return (
    <PageLayout>
      <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Settings</motion.h1>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-2xl">

        {/* Video Background */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Video Background</h3>
            </div>
            <div className="space-y-3">
              {videoBg ? (
                <div className="relative rounded-2xl overflow-hidden h-32 glass">
                  <video src={videoBg} className="w-full h-full object-cover opacity-60" autoPlay muted loop playsInline />
                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setVideoEnabled(!videoEnabled)}
                      className="p-2 rounded-xl glass text-foreground"
                    >
                      {videoEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setVideoBg(null); setVideoEnabled(false); }}
                      className="p-2 rounded-xl glass text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-8 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Upload video (MP4)</span>
                </motion.button>
              )}
              <input ref={fileRef} type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
              
              {videoBg && (
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1.5">Opacity: {videoOpacity}%</label>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    value={videoOpacity}
                    onChange={e => setVideoOpacity(Number(e.target.value))}
                    className="w-full accent-primary h-1"
                  />
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Accent Color */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Accent Color</h3>
            </div>
            <div className="flex gap-3">
              {accentColors.map(c => (
                <motion.button
                  key={c.name}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => applyAccent(c.hsl)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className={`w-10 h-10 rounded-2xl ${c.preview} transition-all ${
                    accentColor === c.hsl
                      ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background glow-primary'
                      : 'opacity-60 hover:opacity-100'
                  }`} />
                  <span className="text-[10px] text-muted-foreground">{c.name}</span>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Visual Preferences */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Visual Effects</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Noise Texture', icon: Sparkles, value: showNoise, set: setShowNoise },
                { label: 'Grid Overlay', icon: Grid3X3, value: showGrid, set: setShowGrid },
                { label: 'Aurora Blobs', icon: Sparkles, value: showBlobs, set: setShowBlobs },
              ].map(pref => (
                <div key={pref.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <pref.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">{pref.label}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => pref.set(!pref.value)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      pref.value ? 'bg-primary/30' : 'bg-white/[0.06]'
                    }`}
                  >
                    <motion.div
                      animate={{ x: pref.value ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-0.5 w-4 h-4 rounded-full ${
                        pref.value ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                    />
                  </motion.button>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <RotateCcw className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Danger Zone</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              This will permanently erase all your data including tasks, journal entries, habits, and settings.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={resetAll}
              className="px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors"
            >
              Reset All Data
            </motion.button>
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default SettingsPage;

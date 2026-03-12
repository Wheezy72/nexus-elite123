import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Eye, EyeOff, Palette, Layers, RotateCcw, Video, Sparkles, Grid3X3, Lock, Download, HardDrive, Bell } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { pinLockService } from '@/services/pinLockService';
import { backupService } from '@/services/backupService';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const accentColors = [
  { name: 'Indigo', hsl: '226 70% 55.5%', preview: 'bg-indigo-500' },
  { name: 'Violet', hsl: '270 70% 55%', preview: 'bg-violet-500' },
  { name: 'Cyan', hsl: '190 80% 50%', preview: 'bg-cyan-500' },
  { name: 'Rose', hsl: '350 70% 55%', preview: 'bg-rose-500' },
  { name: 'Emerald', hsl: '160 70% 45%', preview: 'bg-emerald-500' },
];

const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [videoBg, setVideoBg] = useLocalStorage<string | null>('nexus-video-bg', null);
  const [videoEnabled, setVideoEnabled] = useLocalStorage<boolean>('nexus-video-enabled', true);
  const [videoOpacity, setVideoOpacity] = useLocalStorage<number>('nexus-video-opacity', 15);
  const [accentColor, setAccentColor] = useLocalStorage<string>('nexus-accent-color', '226 70% 55.5%');
  const [showNoise, setShowNoise] = useLocalStorage<boolean>('nexus-show-noise', true);
  const [showGrid, setShowGrid] = useLocalStorage<boolean>('nexus-show-grid', true);
  const [showBlobs, setShowBlobs] = useLocalStorage<boolean>('nexus-show-blobs', true);
  const [pinEnabled, setPinEnabled] = useState(() => pinLockService.hasPin());
  const [pinMode, setPinMode] = useState<'off' | 'set' | 'change'>('off');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backups, setBackups] = useState<Array<{ name: string; path: string; createdAt: string | null }>>([]);
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

  const handlePinSave = async () => {
    try {
      if (newPin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }

      if (pinEnabled) {
        await pinLockService.unlock(currentPin);
        localStorage.removeItem('nexus-chat-history');
        await pinLockService.setPin(newPin);
        toast.success('PIN updated');
      } else {
        await pinLockService.setPin(newPin);
        toast.success('PIN enabled');
      }

      setPinEnabled(true);
      setPinMode('off');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save PIN');
    }
  };

  const handlePinDisable = () => {
    if (!confirm('Disable PIN lock on this device?')) return;
    pinLockService.clearPin();
    setPinEnabled(false);
    setPinMode('off');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    toast.success('PIN disabled');
  };

  const refreshBackups = async () => {
    if (!user) return;
    try {
      const list = await backupService.listBackups(10);
      setBackups(list);
    } catch {
      setBackups([]);
    }
  };

  const backupNow = async () => {
    if (!user) return;
    setBackupBusy(true);
    try {
      const backup = await backupService.createBackupObject(profile?.profile_photo_path || null);
      await backupService.uploadBackup(backup);
      toast.success('Encrypted backup uploaded');
      await refreshBackups();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Backup failed');
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreLatest = async () => {
    if (!user) return;
    setBackupBusy(true);
    try {
      const list = backups.length ? backups : await backupService.listBackups(10);
      const latest = list[0];
      if (!latest) {
        toast.error('No backups found');
        return;
      }

      if (!confirm(`Restore backup: ${latest.name}? This will overwrite local encrypted chat history.`)) return;

      const decrypted = await backupService.downloadAndDecryptBackup(latest.path);
      await backupService.restoreFromBackup(decrypted);
      toast.success('Backup restored');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setBackupBusy(false);
    }
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

  React.useEffect(() => {
    refreshBackups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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

        {/* Smart Notifications */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Smart Notifications</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Optional daily insights (runs while the app is open). You can also allow browser notifications.
            </p>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-foreground">Enable smart notifications</span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const next = !smartNotifsEnabled;
                  setSmartNotifsEnabled(next);
                  notificationService.setEnabled(next);
                  if (next) notificationService.bootstrapDaily();
                }}
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  smartNotifsEnabled ? 'bg-primary/30' : 'bg-white/[0.06]'
                }`}
              >
                <motion.div
                  animate={{ x: smartNotifsEnabled ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-0.5 w-4 h-4 rounded-full ${
                    smartNotifsEnabled ? 'bg-primary' : 'bg-muted-foreground'
                  }`}
                />
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                const perm = await notificationService.requestPermission();
                if (perm === 'granted') toast.success('Browser notifications enabled');
                else toast.error('Browser notifications not enabled');
              }}
              className="mt-3 w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors"
            >
              Enable browser notifications
            </motion.button>
          </GlassCard>
        </motion.div>

        {/* App Lock */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">App Lock</h3>
            </div>

            {!pinEnabled ? (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Add a quick PIN lock on this device. You\'ll unlock Nexus with 4–12 digits.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                    placeholder="New PIN"
                    inputMode="numeric"
                    className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <input
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                    placeholder="Confirm PIN"
                    inputMode="numeric"
                    className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePinSave}
                  disabled={newPin.length < 4 || newPin !== confirmPin}
                  className="mt-3 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                >
                  Enable PIN
                </motion.button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  PIN is enabled on this device. Changing it will clear locally-stored encrypted chat history.
                </p>

                <div className="flex gap-2 mb-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPinMode(pinMode === 'change' ? 'off' : 'change')}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors"
                  >
                    {pinMode === 'change' ? 'Cancel' : 'Change PIN'}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePinDisable}
                    className="px-4 py-2.5 rounded-xl border border-destructive/30 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors"
                  >
                    Disable
                  </motion.button>
                </div>

                {pinMode === 'change' && (
                  <div className="space-y-2">
                    <input
                      value={currentPin}
                      onChange={e => setCurrentPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                      placeholder="Current PIN"
                      inputMode="numeric"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                        placeholder="New PIN"
                        inputMode="numeric"
                        className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                      />
                      <input
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                        placeholder="Confirm PIN"
                        inputMode="numeric"
                        className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePinSave}
                      disabled={currentPin.length < 4 || newPin.length < 4 || newPin !== confirmPin}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                    >
                      Save New PIN
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </motion.div>

        {/* Encrypted Backups */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Encrypted Backups</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              Daily encrypted backup + restore for chat and profile photo. Uses your App Lock key (XChaCha20-Poly1305).
            </p>

            <div className="flex gap-2 mb-3">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={backupNow}
                disabled={backupBusy || !user}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                Backup now
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={restoreLatest}
                disabled={backupBusy || !user}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Restore latest
              </motion.button>
            </div>

            {backups.length > 0 ? (
              <div className="space-y-1">
                {backups.slice(0, 5).map(b => (
                  <div key={b.path} className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate">{b.name}</span>
                    <span className="ml-3 shrink-0">{b.createdAt ? new Date(b.createdAt).toLocaleString() : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No backups found yet.</p>
            )}

            <p className="text-[10px] text-muted-foreground mt-3">
              Requires Storage buckets: <span className="font-medium">nexus-backups</span> and <span className="font-medium">nexus-profile</span>.
            </p>
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

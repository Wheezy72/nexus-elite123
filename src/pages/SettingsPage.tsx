import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Eye, EyeOff, Palette, Layers, RotateCcw, Video, Sparkles, Grid3X3, Lock, Download, HardDrive, Bell } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useJournalTemplates, useTaskTemplates } from '@/hooks/useCloudData';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { pinLockService } from '@/services/pinLockService';
import { backupService } from '@/services/backupService';
import { notificationService } from '@/services/notificationService';
import type { AIClientMode } from '@/services/aiClientService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const themePresets = [
  {
    id: 'forest',
    name: 'Forest',
    desc: 'Deep green + warm cream + neon emerald.',
    preview: {
      bg: '156 58% 8%',
      primary: '145 72% 46%',
      accent: '160 65% 34%',
      fg: '42 35% 92%',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Deep charcoal + clean neon edge.',
    preview: {
      bg: '240 10% 3.9%',
      primary: '226 70% 55.5%',
      accent: '280 60% 55%',
      fg: '0 0% 98%',
    },
  },
  {
    id: 'ivory',
    name: 'Ivory',
    desc: 'Warm paper + deep ink accents.',
    preview: {
      bg: '40 40% 96%',
      primary: '156 58% 18%',
      accent: '28 80% 45%',
      fg: '156 38% 10%',
    },
  },
] as const;

const SettingsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const taskTemplates = useTaskTemplates();
  const journalTemplates = useJournalTemplates();
  const [videoBg, setVideoBg] = useLocalStorage<string | null>('future-video-bg', null);
  const [videoEnabled, setVideoEnabled] = useLocalStorage<boolean>('future-video-enabled', true);
  const [videoOpacity, setVideoOpacity] = useLocalStorage<number>('future-video-opacity', 15);

  const [bgStyle, setBgStyle] = useLocalStorage<'aura' | 'static' | 'video'>('future-bg-style', 'aura');
  const [theme, setTheme] = useLocalStorage<string>('future-theme', 'forest');
  const [showAura, setShowAura] = useLocalStorage<boolean>('future-show-aura', true);
  const [showNoise, setShowNoise] = useLocalStorage<boolean>('future-show-noise', false);
  const [showGrid, setShowGrid] = useLocalStorage<boolean>('future-show-grid', false);

  const [smartNotifsEnabled, setSmartNotifsEnabled] = useLocalStorage<boolean>('future-smart-notifications-enabled', true);

  const [aiMode, setAiMode] = useLocalStorage<AIClientMode>('future-ai-mode', 'server');
  const [aiBYOKKey, setAiBYOKKey] = useLocalStorage<string>('future-ai-byok-key', '');
  const [weeklyRecapEnabled, setWeeklyRecapEnabled] = useLocalStorage<boolean>('future-weekly-recap-enabled', true);

  const [pinEnabled, setPinEnabled] = useState(() => pinLockService.hasPin());
  const [pinMode, setPinMode] = useState<'off' | 'set' | 'change'>('off');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [backups, setBackups] = useState<Array<{ name: string; path: string; createdAt: string | null }>>([]);
  const [showAIKey, setShowAIKey] = useState(false);

  const [templateTab, setTemplateTab] = useState<'tasks' | 'journal'>('tasks');

  const [editingTaskTemplateId, setEditingTaskTemplateId] = useState<string | null>(null);
  const [taskTemplateName, setTaskTemplateName] = useState('');
  const [taskTemplateDescription, setTaskTemplateDescription] = useState('');
  const [taskTemplateLines, setTaskTemplateLines] = useState('');

  const [editingJournalTemplateId, setEditingJournalTemplateId] = useState<string | null>(null);
  const [journalTemplateName, setJournalTemplateName] = useState('');
  const [journalTemplateDescription, setJournalTemplateDescription] = useState('');
  const [journalTemplateTags, setJournalTemplateTags] = useState('');
  const [journalTemplateText, setJournalTemplateText] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setVideoBg(reader.result as string);
      setVideoEnabled(true);
      setBgStyle('video');
    };
    reader.readAsDataURL(file);
  };

  const applyTheme = (id: string) => {
    setTheme(id);
    document.documentElement.setAttribute('data-theme', id);
  };

  const resetAll = () => {
    if (!confirm('This will clear ALL app data. Are you sure?')) return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith('future-') || k.startsWith('future'));
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const resetTaskTemplateForm = () => {
    setEditingTaskTemplateId(null);
    setTaskTemplateName('');
    setTaskTemplateDescription('');
    setTaskTemplateLines('');
  };

  const resetJournalTemplateForm = () => {
    setEditingJournalTemplateId(null);
    setJournalTemplateName('');
    setJournalTemplateDescription('');
    setJournalTemplateTags('');
    setJournalTemplateText('');
  };

  const saveTaskTemplate = () => {
    const name = taskTemplateName.trim();
    if (!name) {
      toast.error('Template name required');
      return;
    }

    const tasks = taskTemplateLines
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .map(text => ({ text, column: 'todo' as const, priority: 'medium' as const, subtasks: [] as Array<{ id: string; text: string; done: boolean }> }));

    const payload = {
      name,
      description: taskTemplateDescription.trim(),
      tasks,
    };

    if (editingTaskTemplateId) {
      taskTemplates.updateTemplate.mutate(
        { id: editingTaskTemplateId, ...payload },
        {
          onSuccess: () => {
            toast.success('Task template updated');
            resetTaskTemplateForm();
          },
          onError: () => toast.error('Failed to update template'),
        }
      );
    } else {
      taskTemplates.addTemplate.mutate(payload, {
        onSuccess: () => {
          toast.success('Task template created');
          resetTaskTemplateForm();
        },
        onError: () => toast.error('Failed to create template'),
      });
    }
  };

  const saveJournalTemplate = () => {
    const name = journalTemplateName.trim();
    if (!name) {
      toast.error('Template name required');
      return;
    }

    const tags = journalTemplateTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      name,
      description: journalTemplateDescription.trim(),
      text: journalTemplateText,
      tags,
    };

    if (editingJournalTemplateId) {
      journalTemplates.updateTemplate.mutate(
        { id: editingJournalTemplateId, ...payload },
        {
          onSuccess: () => {
            toast.success('Journal template updated');
            resetJournalTemplateForm();
          },
          onError: () => toast.error('Failed to update template'),
        }
      );
    } else {
      journalTemplates.addTemplate.mutate(payload, {
        onSuccess: () => {
          toast.success('Journal template created');
          resetJournalTemplateForm();
        },
        onError: () => toast.error('Failed to create template'),
      });
    }
  };

  const handlePinSave = async () => {
    try {
      if (newPin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }

      if (pinEnabled) {
        await pinLockService.unlock(currentPin);
        localStorage.removeItem('future-chat-history');
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
                      onClick={() => { setVideoBg(null); setVideoEnabled(false); setBgStyle('aura'); }}
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

        {/* Theme Preset */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Theme</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Switch the full palette (background, surfaces, text, charts). This keeps the app looking consistent.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themePresets.map(p => {
                const active = theme === p.id;
                return (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyTheme(p.id)}
                    className={`text-left p-4 rounded-3xl border transition-colors ${
                      active ? 'border-primary/40 bg-primary/10' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-2xl border ${active ? 'border-primary/40' : 'border-white/[0.10]'}`}
                        style={{
                          background: `radial-gradient(circle at 30% 30%, hsl(${p.preview.primary}) 0%, hsl(${p.preview.accent}) 35%, hsl(${p.preview.bg}) 100%)`,
                        }}
                      />
                    </div>

                    {active && (
                      <div className="mt-3 text-[10px] text-primary font-semibold">Active</div>
                    )}
                  </motion.button>
                );
              })}
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
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground">Background style</span>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.08] p-1">
                  {([
                    { id: 'aura', label: 'Aura' },
                    { id: 'static', label: 'Static' },
                    { id: 'video', label: 'Video' },
                  ] as const).map(opt => {
                    const active = bgStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setBgStyle(opt.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {[
                { label: 'Aura', icon: Sparkles, value: showAura, set: setShowAura },
                { label: 'Noise texture', icon: Sparkles, value: showNoise, set: setShowNoise },
                { label: 'Grid overlay', icon: Grid3X3, value: showGrid, set: setShowGrid },
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

        {/* Premium Intelligence */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Premium Intelligence</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-3">
              AI is optional. Use the server provider, or bring your own key (stored only on this device).
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-foreground">AI mode</p>
                  <p className="text-[10px] text-muted-foreground">Server / Off / BYOK OpenAI / BYOK Gemini</p>
                </div>
                <select
                  value={aiMode}
                  onChange={e => {
                    const next = e.target.value as AIClientMode;
                    setAiMode(next);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-xs outline-none focus:border-primary/40"
                >
                  <option value="server">Server</option>
                  <option value="off">Off</option>
                  <option value="openai">BYOK OpenAI</option>
                  <option value="gemini">BYOK Gemini</option>
                </select>
              </div>

              {(aiMode === 'openai' || aiMode === 'gemini') && (
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-1">API key (device-only)</label>
                  <div className="flex gap-2">
                    <input
                      type={showAIKey ? 'text' : 'password'}
                      value={aiBYOKKey}
                      onChange={e => {
                        setAiBYOKKey(e.target.value);
                      }}
                      placeholder={aiMode === 'openai' ? 'sk-…' : 'AIza…'}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                    />
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAIKey(v => !v)}
                      className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground"
                    >
                      {showAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-foreground">Weekly recap (AI summary)</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setWeeklyRecapEnabled(v => !v)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    weeklyRecapEnabled ? 'bg-primary/30' : 'bg-white/[0.06]'
                  }`}
                >
                  <motion.div
                    animate={{ x: weeklyRecapEnabled ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 w-4 h-4 rounded-full ${
                      weeklyRecapEnabled ? 'bg-primary' : 'bg-muted-foreground'
                    }`}
                  />
                </motion.button>
              </div>

              <p className="text-[10px] text-muted-foreground">
                BYOK calls go to this server, which forwards requests to your provider without storing your key.
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Templates */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-5" tilt={false}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Templates</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-3">Synced across devices. Use templates for Tasks and Brain Dump.</p>

            <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.08] p-1 mb-3">
              {([
                { id: 'tasks', label: 'Tasks' },
                { id: 'journal', label: 'Journal' },
              ] as const).map(opt => {
                const active = templateTab === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTemplateTab(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-colors ${
                      active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {templateTab === 'tasks' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {taskTemplates.templates.map(tpl => (
                    <div key={tpl.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{tpl.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{tpl.description || `${tpl.tasks.length} tasks`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEditingTaskTemplateId(tpl.id);
                            setTaskTemplateName(tpl.name);
                            setTaskTemplateDescription(tpl.description || '');
                            setTaskTemplateLines((tpl.tasks || []).map(x => x.text).join('\n'));
                            setTemplateTab('tasks');
                          }}
                          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-[11px] font-semibold hover:bg-white/[0.06] transition-colors"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => taskTemplates.deleteTemplate.mutate(tpl.id)}
                          className="px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  ))}

                  {!user && (
                    <p className="text-[11px] text-muted-foreground">Sign in to sync templates across devices.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{editingTaskTemplateId ? 'Edit task template' : 'New task template'}</p>
                    {(editingTaskTemplateId || taskTemplateName || taskTemplateLines) && (
                      <button onClick={resetTaskTemplateForm} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
                    )}
                  </div>
                  <input
                    value={taskTemplateName}
                    onChange={e => setTaskTemplateName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <input
                    value={taskTemplateDescription}
                    onChange={e => setTaskTemplateDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <textarea
                    value={taskTemplateLines}
                    onChange={e => setTaskTemplateLines(e.target.value)}
                    placeholder="One task per line…"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={saveTaskTemplate}
                    disabled={!user || taskTemplates.addTemplate.isPending || taskTemplates.updateTemplate.isPending}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {editingTaskTemplateId ? 'Save changes' : 'Create template'}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {journalTemplates.templates.map(tpl => (
                    <div key={tpl.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{tpl.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{tpl.description || (tpl.tags?.length ? tpl.tags.join(', ') : '—')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setEditingJournalTemplateId(tpl.id);
                            setJournalTemplateName(tpl.name);
                            setJournalTemplateDescription(tpl.description || '');
                            setJournalTemplateTags((tpl.tags || []).join(', '));
                            setJournalTemplateText(tpl.text || '');
                            setTemplateTab('journal');
                          }}
                          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-[11px] font-semibold hover:bg-white/[0.06] transition-colors"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => journalTemplates.deleteTemplate.mutate(tpl.id)}
                          className="px-3 py-2 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  ))}

                  {!user && (
                    <p className="text-[11px] text-muted-foreground">Sign in to sync templates across devices.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{editingJournalTemplateId ? 'Edit journal template' : 'New journal template'}</p>
                    {(editingJournalTemplateId || journalTemplateName || journalTemplateText) && (
                      <button onClick={resetJournalTemplateForm} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
                    )}
                  </div>
                  <input
                    value={journalTemplateName}
                    onChange={e => setJournalTemplateName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <input
                    value={journalTemplateDescription}
                    onChange={e => setJournalTemplateDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <input
                    value={journalTemplateTags}
                    onChange={e => setJournalTemplateTags(e.target.value)}
                    placeholder="Tags (comma separated)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <textarea
                    value={journalTemplateText}
                    onChange={e => setJournalTemplateText(e.target.value)}
                    placeholder="Template text…"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={saveJournalTemplate}
                    disabled={!user || journalTemplates.addTemplate.isPending || journalTemplates.updateTemplate.isPending}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {editingJournalTemplateId ? 'Save changes' : 'Create template'}
                  </motion.button>
                </div>
              </div>
            )}
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
                  Add a quick PIN lock on this device. You'll unlock Future with 4–12 digits.
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

            <p className="text-[10px] text-muted-foreground">
                Requires Storage buckets: <span className="font-medium">future-backups</span> and <span className="font-medium">future-profile</span>.
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

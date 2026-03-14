import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useMood } from '@/hooks/useCloudData';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

const MOODS = [
  { emoji: '😄', label: 'Amazing', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Low', value: 2 },
  { emoji: '😢', label: 'Rough', value: 1 },
];

const TRIGGERS = [
  { emoji: '💼', label: 'Work' },
  { emoji: '🏃', label: 'Exercise' },
  { emoji: '👥', label: 'Social' },
  { emoji: '😴', label: 'Sleep' },
  { emoji: '🌤️', label: 'Weather' },
  { emoji: '🍽️', label: 'Food' },
  { emoji: '💊', label: 'Health' },
  { emoji: '🎮', label: 'Leisure' },
];

type Mood = typeof MOODS[number];

type MoodQuickLogProps = {
  compact?: boolean;
};

const MoodQuickLog: React.FC<MoodQuickLogProps> = ({ compact }) => {
  const { addEntry, updateEntry } = useMood();
  const [open, setOpen] = useState(false);
  const [activeMood, setActiveMood] = useState<Mood | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const moodSize = compact ? 'text-2xl' : 'text-3xl';
  const pad = compact ? 'p-2.5' : 'p-3.5';

  const resetSheet = () => {
    setActiveMood(null);
    setEntryId(null);
    setNote('');
    setSelectedTriggers([]);
    setCreating(false);
  };

  const toggleTrigger = (label: string) => {
    setSelectedTriggers(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label],
    );
  };

  const logMood = async (m: Mood) => {
    setActiveMood(m);
    setEntryId(null);
    setNote('');
    setSelectedTriggers([]);
    setOpen(true);
    setCreating(true);

    try {
      const created = await addEntry.mutateAsync({
        emoji: m.emoji,
        label: m.label,
        note: '',
        date: new Date().toISOString(),
        triggers: [],
      });
      setEntryId(created?.id ?? null);
    } catch (e) {
      setOpen(false);
      toast.error(e instanceof Error ? e.message : 'Failed to log mood');
    } finally {
      setCreating(false);
    }
  };

  const saveDetails = async () => {
    if (!entryId) {
      setOpen(false);
      return;
    }

    try {
      await updateEntry.mutateAsync({
        id: entryId,
        note: note.trim(),
        triggers: selectedTriggers,
      });
      setOpen(false);
      toast.success('Mood logged');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save details');
    }
  };

  const title = useMemo(() => {
    if (!activeMood) return 'Add details';
    return `${activeMood.emoji} ${activeMood.label}`;
  }, [activeMood]);

  return (
    <>
      <div className="flex justify-between">
        {MOODS.map(m => (
          <motion.button
            key={m.label}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => logMood(m)}
            className={`flex flex-col items-center gap-1 ${pad} rounded-2xl transition-all hover:bg-white/[0.04]`}
            aria-label={`Log mood: ${m.label}`}
          >
            <span className={moodSize}>{m.emoji}</span>
            {!compact && <span className="text-[10px] text-muted-foreground">{m.label}</span>}
          </motion.button>
        ))}
      </div>

      <Drawer
        open={open}
        onOpenChange={v => {
          setOpen(v);
          if (!v) resetSheet();
        }}
      >
        <DrawerContent className="glass border border-white/[0.08] bg-background/60 backdrop-blur-xl rounded-t-3xl">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">Add optional triggers or a note. You can also skip.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              >
                Skip
              </button>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground mb-2">What influenced this?</p>
              <div className="flex flex-wrap gap-2">
                {TRIGGERS.map(t => (
                  <motion.button
                    key={t.label}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => toggleTrigger(t.label)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                      selectedTriggers.includes(t.label)
                        ? 'bg-primary/20 text-primary'
                        : 'glass text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note (optional)..."
              className="w-full glass rounded-2xl px-4 py-3 text-sm text-foreground bg-transparent outline-none resize-none h-24"
            />

            <div className="mt-4 flex gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors"
              >
                Done
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={saveDetails}
                disabled={creating || !entryId}
                className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {creating ? 'Logging…' : 'Save details'}
              </motion.button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MoodQuickLog;

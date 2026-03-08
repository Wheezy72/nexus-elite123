import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Search, X, Smile, Meh, Frown, Laugh, Angry, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import { rewardAction } from '@/lib/rewards';
import EmptyState from './EmptyState';

interface JournalEntry {
  id: string;
  text: string;
  mood: number | null;
  timestamp: string;
  tags: string[];
}

const moodIcons = [Angry, Frown, Meh, Smile, Laugh];
const moodLabels = ['Awful', 'Bad', 'Meh', 'Good', 'Great'];
const moodBorders = [
  'border-l-red-500/50',
  'border-l-orange-400/50',
  'border-l-muted-foreground/30',
  'border-l-emerald-400/50',
  'border-l-primary/50',
];

const listStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

const BrainDump: React.FC = () => {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('nexus-journal', []);
  const [text, setText] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const save = () => {
    if (!text.trim()) return;
    setEntries(prev => [{
      id: crypto.randomUUID(),
      text: text.trim(),
      mood,
      timestamp: new Date().toISOString(),
      tags,
    }, ...prev]);
    setText('');
    setMood(null);
    setTags([]);
    setShowCompose(false);
    rewardAction('journal_entry');
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.text.toLowerCase().includes(q) ||
      e.tags.some(t => t.includes(q))
    );
  }, [entries, search]);

  return (
    <GlassCard className="p-6" tilt={false}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Brain Dump</h2>
          {entries.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary tabular-nums">
              {entries.length}
            </span>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCompose(!showCompose)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showCompose ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {showCompose ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Compose */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass rounded-xl p-4 space-y-3 border-l-2 border-l-primary/40">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What's on your mind? Just dump it..."
                rows={4}
                className="w-full bg-transparent outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground/50"
              />

              {/* Word / char count */}
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground/50">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
              </div>

              {/* Mood selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">Mood:</span>
                {moodIcons.map((Icon, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.8 }}
                    whileHover={{ scale: 1.15 }}
                    onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                      mood === i + 1
                        ? 'bg-primary/20 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                        : 'hover:bg-accent/20'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${mood === i + 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                  </motion.button>
                ))}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary flex items-center gap-1">
                    #{t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                  placeholder="+ tag"
                  className="text-[11px] bg-transparent outline-none text-muted-foreground w-16 placeholder:text-muted-foreground/40"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={save}
                disabled={!text.trim()}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
              >
                Save Entry
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      {entries.length > 0 && (
        <div className="glass rounded-lg flex items-center gap-2 px-3 py-2 mb-3">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="flex-1 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      {/* Entries */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title={search ? 'No matches' : 'No entries yet'}
          description={search ? 'Try a different search term' : 'Dump your thoughts freely'}
          actionLabel={!search ? 'Write Now' : undefined}
          onAction={!search ? () => setShowCompose(true) : undefined}
        />
      ) : (
        <motion.div
          variants={listStagger}
          initial="hidden"
          animate="show"
          className="space-y-2 max-h-[300px] overflow-y-auto"
        >
          {filtered.map(entry => {
            const MoodIcon = entry.mood ? moodIcons[entry.mood - 1] : null;
            const isLong = entry.text.length > 200;
            const isExpanded = expandedIds.has(entry.id);
            const borderClass = entry.mood ? moodBorders[entry.mood - 1] : 'border-l-white/10';
            return (
              <motion.div
                key={entry.id}
                variants={listItem}
                layout
                className={`glass rounded-xl p-3 group relative border-l-2 ${borderClass} hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-shadow`}
              >
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
                <p className={`text-xs text-foreground whitespace-pre-wrap mb-2 pr-4 ${
                  isLong && !isExpanded ? 'line-clamp-3' : ''
                }`}>
                  {entry.text}
                </p>
                {isLong && (
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary mb-1.5 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] text-muted-foreground/60">
                    {new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {MoodIcon && (
                    <div className="flex items-center gap-0.5">
                      <MoodIcon className="w-3 h-3 text-primary" />
                      <span className="text-[9px] text-primary/60">{entry.mood ? moodLabels[entry.mood - 1] : ''}</span>
                    </div>
                  )}
                  {entry.tags.map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/80">#{t}</span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </GlassCard>
  );
};

export default BrainDump;

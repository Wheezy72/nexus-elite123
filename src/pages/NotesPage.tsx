import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Tag, Search } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import QuickCapture from '@/components/QuickCapture';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ['All', 'Personal', 'Work', 'Ideas', 'Learning'];

const NotesPage = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>('nexus-notes', []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const activeNote = notes.find(n => n.id === activeId);

  const addNote = () => {
    const n: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled',
      content: '',
      category: category === 'All' ? 'Personal' : category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [n, ...prev]);
    setActiveId(n.id);
  };

  const updateNote = (field: keyof Note, value: string) => {
    setNotes(prev => prev.map(n =>
      n.id === activeId ? { ...n, [field]: value, updatedAt: new Date().toISOString() } : n
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const filtered = notes.filter(n => {
    if (category !== 'All' && n.category !== category) return false;
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <PageLayout>
      <motion.h1 variants={staggerItem} initial="hidden" animate="show" className="text-2xl font-bold text-foreground mb-6">Notes</motion.h1>
      
      <motion.div variants={staggerItem} initial="hidden" animate="show">
        <QuickCapture />
      </motion.div>
      
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[60vh]">
        {/* Sidebar */}
        <motion.div variants={staggerItem}>
          <GlassCard className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full glass rounded-xl pl-9 pr-3 py-2 text-xs text-foreground bg-transparent outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCategory(c)}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all ${
                    category === c ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={addNote}
              className="w-full py-2 rounded-2xl bg-primary/15 text-primary text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-primary/25 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Note
            </motion.button>

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              <AnimatePresence>
                {filtered.map(n => (
                  <motion.button
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onClick={() => setActiveId(n.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all group ${
                      activeId === n.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.content.slice(0, 60) || 'Empty note'}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={e => { e.stopPropagation(); deleteNote(n.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </motion.button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/30 text-muted-foreground">{n.category}</span>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>

        {/* Editor */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <GlassCard className="p-5 flex flex-col min-h-[60vh]">
            {activeNote ? (
              <>
                <input
                  value={activeNote.title}
                  onChange={e => updateNote('title', e.target.value)}
                  className="text-lg font-bold text-foreground bg-transparent outline-none mb-1"
                  placeholder="Note title..."
                />
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-3 h-3 text-muted-foreground" />
                  <select
                    value={activeNote.category}
                    onChange={e => updateNote('category', e.target.value)}
                    className="text-[10px] bg-transparent text-muted-foreground outline-none"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} className="bg-background">{c}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(activeNote.updatedAt).toLocaleString()}
                  </span>
                </div>
                <textarea
                  value={activeNote.content}
                  onChange={e => updateNote('content', e.target.value)}
                  placeholder="Start writing..."
                  className="flex-1 text-sm text-foreground/90 bg-transparent outline-none resize-none leading-relaxed"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select or create a note</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default NotesPage;

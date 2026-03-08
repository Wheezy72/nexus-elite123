import React from 'react';
import { motion } from 'framer-motion';
import {
  Smile, Meh, Frown, Laugh, Angry,
  Dumbbell, BookOpen, Brain, Music, Coffee, Moon, Heart, Flame
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface MoodEntry {
  id: string;
  timestamp: string;
  mood: number;
  activities: string[];
}

const moods = [
  { icon: Angry, label: 'Awful', value: 1 },
  { icon: Frown, label: 'Bad', value: 2 },
  { icon: Meh, label: 'Meh', value: 3 },
  { icon: Smile, label: 'Good', value: 4 },
  { icon: Laugh, label: 'Great', value: 5 },
];

const activities = [
  { icon: Dumbbell, label: 'Exercise' },
  { icon: BookOpen, label: 'Reading' },
  { icon: Brain, label: 'Meditate' },
  { icon: Music, label: 'Music' },
  { icon: Coffee, label: 'Coffee' },
  { icon: Moon, label: 'Sleep' },
  { icon: Heart, label: 'Social' },
  { icon: Flame, label: 'Creative' },
];

const MicroLogger: React.FC = () => {
  const [entries, setEntries] = useLocalStorage<MoodEntry[]>('nexus-mood-log', []);
  const [selectedMood, setSelectedMood] = React.useState<number | null>(null);
  const [selectedActivities, setSelectedActivities] = React.useState<string[]>([]);

  const toggleActivity = (label: string) => {
    setSelectedActivities(prev =>
      prev.includes(label) ? prev.filter(a => a !== label) : [...prev, label]
    );
  };

  const saveEntry = () => {
    if (selectedMood === null) return;
    setEntries(prev => [{
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      mood: selectedMood,
      activities: selectedActivities,
    }, ...prev]);
    setSelectedMood(null);
    setSelectedActivities([]);
  };

  const todayEntries = entries.filter(e => {
    const d = new Date(e.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">Mood Log</h2>

      {/* Mood row */}
      <div className="flex justify-between mb-4">
        {moods.map(m => (
          <motion.button
            key={m.value}
            whileTap={{ scale: 0.75 }}
            animate={selectedMood === m.value ? { scale: 1.2 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 12 }}
            onClick={() => setSelectedMood(m.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              selectedMood === m.value ? 'bg-primary/20' : 'hover:bg-accent/50'
            }`}
          >
            <m.icon className={`w-6 h-6 ${selectedMood === m.value ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-[10px] text-muted-foreground">{m.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Activity grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {activities.map(a => (
          <motion.button
            key={a.label}
            whileTap={{ scale: 0.8 }}
            animate={selectedActivities.includes(a.label) ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 12 }}
            onClick={() => toggleActivity(a.label)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
              selectedActivities.includes(a.label) ? 'bg-primary/20' : 'hover:bg-accent/50'
            }`}
          >
            <a.icon className={`w-5 h-5 ${selectedActivities.includes(a.label) ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-[10px] text-muted-foreground">{a.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Save */}
      {selectedMood !== null && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.92 }}
          onClick={saveEntry}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium mb-4"
        >
          Log Entry
        </motion.button>
      )}

      {/* Today's history */}
      {todayEntries.length === 0 ? (
        <EmptyState
          icon={Smile}
          title="No entries yet"
          description="Log your mood to start tracking"
        />
      ) : (
        <div className="space-y-2 max-h-[120px] overflow-y-auto">
          {todayEntries.slice(0, 5).map(e => (
            <div key={e.id} className="flex items-center justify-between glass rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                {React.createElement(moods[e.mood - 1].icon, { className: 'w-4 h-4 text-primary' })}
                <span className="text-xs text-muted-foreground">
                  {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{e.activities.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

export default MicroLogger;

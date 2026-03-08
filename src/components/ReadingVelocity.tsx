import React, { useState, useEffect } from 'react';
import { BookOpen, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface MoodEntry { id: string; timestamp: string; mood: number; activities: string[]; }
interface FlowSession { id: string; startedAt: string; duration: number; type: 'focus' | 'break'; }

const ReadingVelocity: React.FC = () => {
  const [pagesGoal, setPagesGoal] = useLocalStorage<number>('nexus-pages-goal', 0);
  const [pagesRead, setPagesRead] = useLocalStorage<number>('nexus-pages-read', 0);
  const [startTime, setStartTime] = useLocalStorage<string | null>('nexus-reading-start', null);
  const [moodEntries] = useLocalStorage<MoodEntry[]>('nexus-mood-log', []);
  const [flowSessions] = useLocalStorage<FlowSession[]>('nexus-flow-sessions', []);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startTime) return;
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, [startTime]);

  const elapsed = startTime ? (now - new Date(startTime).getTime()) / 60000 : 0; // minutes
  const ppm = elapsed > 0 && pagesRead > 0 ? pagesRead / elapsed : 0;
  const remaining = pagesGoal - pagesRead;
  const eta = ppm > 0 ? remaining / ppm : 0;

  const startReading = () => {
    setStartTime(new Date().toISOString());
    setPagesRead(0);
  };

  // Build chart data: pair mood entries with focus sessions by hour
  const chartData = React.useMemo(() => {
    const hours = new Map<string, { energy: number; focus: number; count: number }>();
    moodEntries.forEach(e => {
      const h = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit' });
      const prev = hours.get(h) || { energy: 0, focus: 0, count: 0 };
      prev.energy += e.mood;
      prev.count++;
      hours.set(h, prev);
    });
    flowSessions.filter(s => s.type === 'focus').forEach(s => {
      const h = new Date(s.startedAt).toLocaleTimeString([], { hour: '2-digit' });
      const prev = hours.get(h) || { energy: 0, focus: 0, count: 0 };
      prev.focus += s.duration / 60;
      hours.set(h, prev);
    });
    return Array.from(hours.entries()).map(([hour, d]) => ({
      hour,
      energy: Math.round((d.energy / Math.max(d.count, 1)) * 20),
      focus: Math.round(d.focus),
    }));
  }, [moodEntries, flowSessions]);

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">Reading Velocity</h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Pages Goal</label>
          <input
            type="number"
            value={pagesGoal || ''}
            onChange={e => setPagesGoal(Number(e.target.value))}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-foreground bg-transparent outline-none"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Pages Read</label>
          <input
            type="number"
            value={pagesRead || ''}
            onChange={e => setPagesRead(Number(e.target.value))}
            className="w-full glass rounded-lg px-3 py-2 text-sm text-foreground bg-transparent outline-none"
            placeholder="0"
          />
        </div>
      </div>

      {!startTime ? (
        <button
          onClick={startReading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium mb-4"
        >
          Start Session
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xl font-bold tabular-nums text-foreground">{ppm.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">pages/min</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xl font-bold tabular-nums text-foreground">
              {eta > 0 ? `${Math.round(eta)}m` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">ETA to goal</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Mental Energy vs Focus Duration</p>
        {chartData.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No data yet"
            description="Log moods and complete focus sessions to see insights"
          />
        ) : (
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="energy" stroke="hsl(226, 70%, 55.5%)" strokeWidth={2} dot={false} name="Energy %" />
                <Line type="monotone" dataKey="focus" stroke="hsl(280, 70%, 55%)" strokeWidth={2} dot={false} name="Focus (min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default ReadingVelocity;

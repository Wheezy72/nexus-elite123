import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, Flame, TrendingUp, Zap } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import EmptyState from './EmptyState';

interface FlowSession {
  id: string;
  startedAt: string;
  duration: number;
  type: 'focus' | 'break';
}

interface MoodEntry {
  id: string;
  timestamp: string;
  mood: number;
  activities: string[];
}

const FocusStats: React.FC = () => {
  const [sessions] = useLocalStorage<FlowSession[]>('nexus-flow-sessions', []);
  const [moodEntries] = useLocalStorage<MoodEntry[]>('nexus-mood-log', []);

  const stats = useMemo(() => {
    const now = new Date();
    const todaySessions = sessions.filter(s => {
      const d = new Date(s.startedAt);
      return s.type === 'focus' && d.toDateString() === now.toDateString();
    });
    const totalToday = todaySessions.reduce((a, s) => a + s.duration, 0);
    const totalAll = sessions.filter(s => s.type === 'focus').reduce((a, s) => a + s.duration, 0);

    // Weekly data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const daySessions = sessions.filter(s => s.type === 'focus' && new Date(s.startedAt).toDateString() === dateStr);
      const focusMin = Math.round(daySessions.reduce((a, s) => a + s.duration, 0) / 60);
      const dayMoods = moodEntries.filter(e => new Date(e.timestamp).toDateString() === dateStr);
      const avgMood = dayMoods.length > 0 ? Math.round((dayMoods.reduce((a, e) => a + e.mood, 0) / dayMoods.length) * 20) : 0;
      weeklyData.push({ day: dayLabel, focus: focusMin, energy: avgMood, sessions: daySessions.length });
    }

    // Best hour
    const hourMap = new Map<number, number>();
    sessions.filter(s => s.type === 'focus').forEach(s => {
      const h = new Date(s.startedAt).getHours();
      hourMap.set(h, (hourMap.get(h) || 0) + s.duration);
    });
    let bestHour = -1;
    let bestVal = 0;
    hourMap.forEach((v, k) => { if (v > bestVal) { bestVal = v; bestHour = k; } });

    return { totalToday, totalAll, todayCount: todaySessions.length, weeklyData, bestHour };
  }, [sessions, moodEntries]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const hasData = sessions.some(s => s.type === 'focus');

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">Focus Stats</h2>

      {!hasData ? (
        <EmptyState icon={TrendingUp} title="No sessions yet" description="Complete focus sessions to see your stats" />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="glass rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold tabular-nums text-foreground">{formatTime(stats.totalToday)}</p>
              <p className="text-[9px] text-muted-foreground">Today</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold tabular-nums text-foreground">{stats.todayCount}</p>
              <p className="text-[9px] text-muted-foreground">Sessions</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-bold tabular-nums text-foreground">
                {stats.bestHour >= 0 ? `${stats.bestHour}:00` : '—'}
              </p>
              <p className="text-[9px] text-muted-foreground">Best Hour</p>
            </div>
          </div>

          {/* Weekly focus chart */}
          <p className="text-xs text-muted-foreground mb-2">Weekly Focus (min)</p>
          <div className="h-[130px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="focus" fill="hsl(226, 70%, 55.5%)" radius={[4, 4, 0, 0]} name="Focus (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Energy trend */}
          <p className="text-xs text-muted-foreground mb-2">Energy Trend (%)</p>
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyData}>
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="energy" stroke="hsl(280, 70%, 55%)" strokeWidth={2} dot={{ r: 3 }} name="Energy %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </GlassCard>
  );
};

export default FocusStats;

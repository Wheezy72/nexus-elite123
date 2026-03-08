import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Clock, Flame, Target, TrendingUp } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface FlowSession {
  id: string;
  startedAt: string;
  duration: number;
  type: 'focus' | 'break';
}

const COLORS = ['hsl(226 70% 55.5%)', 'hsl(280 60% 55%)', 'hsl(200 70% 55%)', 'hsl(340 60% 55%)'];

const StatsPage = () => {
  const [sessions] = useLocalStorage<FlowSession[]>('nexus-flow-sessions', []);

  const focusSessions = sessions.filter(s => s.type === 'focus');
  const totalFocusMin = Math.round(focusSessions.reduce((s, x) => s + x.duration, 0) / 60);
  const avgSession = focusSessions.length ? Math.round(totalFocusMin / focusSessions.length) : 0;

  // Daily data last 7 days
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const daySessions = focusSessions.filter(s => s.startedAt.startsWith(key));
    const mins = Math.round(daySessions.reduce((s, x) => s + x.duration, 0) / 60);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), minutes: mins, sessions: daySessions.length };
  });

  // Streak
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (focusSessions.some(s => s.startedAt.startsWith(key))) streak++;
    else if (i > 0) break;
  }

  // Distribution by hour
  const hourDist = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    count: focusSessions.filter(s => new Date(s.startedAt).getHours() === h).length,
  })).filter(h => h.count > 0);

  const pieData = [
    { name: 'Focus', value: totalFocusMin },
    { name: 'Breaks', value: Math.round(sessions.filter(s => s.type === 'break').reduce((s, x) => s + x.duration, 0) / 60) },
  ];

  const statCards = [
    { label: 'Total Focus', value: `${totalFocusMin}m`, icon: Clock },
    { label: 'Sessions', value: focusSessions.length, icon: Target },
    { label: 'Avg Session', value: `${avgSession}m`, icon: TrendingUp },
    { label: 'Streak', value: `${streak}d`, icon: Flame },
  ];

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Pomodoro Stats</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard className="p-4 text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily bar chart */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Daily Focus (minutes)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(240 10% 8%)', border: '1px solid hsl(240 5% 17%)', borderRadius: 8, fontSize: 12, color: 'hsl(0 0% 98%)' }} />
              <Bar dataKey="minutes" fill="hsl(226 70% 55.5%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Sessions trend */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Sessions Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={daily}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(240 10% 8%)', border: '1px solid hsl(240 5% 17%)', borderRadius: 8, fontSize: 12, color: 'hsl(0 0% 98%)' }} />
              <Line type="monotone" dataKey="sessions" stroke="hsl(280 60% 55%)" strokeWidth={2} dot={{ fill: 'hsl(280 60% 55%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Focus vs Break pie */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Focus vs Break</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(240 10% 8%)', border: '1px solid hsl(240 5% 17%)', borderRadius: 8, fontSize: 12, color: 'hsl(0 0% 98%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] text-muted-foreground">{d.name} ({d.value}m)</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Peak hours */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Peak Focus Hours</h2>
          {hourDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourDist}>
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 64.9%)' }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="hsl(200 70% 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Complete focus sessions to see data</p>
            </div>
          )}
        </GlassCard>
      </div>
    </PageLayout>
  );
};

export default StatsPage;

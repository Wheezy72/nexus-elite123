import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Plus, Loader2 } from 'lucide-react';
import PageLayout, { staggerContainer, staggerItem } from '@/components/PageLayout';
import GlassCard from '@/components/GlassCard';
import { useTasks } from '@/hooks/useCloudData';
import { toast } from 'sonner';

interface StudyPlanRequest {
  subject: string;
  duration: string;
  examDate?: string;
  learningStyle: 'visual' | 'text' | 'hands-on' | 'mixed';
  hoursAvailable: number;
}

interface StudyDay {
  day: number;
  topics: string[];
  activities: string[];
  duration: number;
}

interface StudyPlan {
  id: string;
  title: string;
  days: StudyDay[];
  resources: string[];
  spacedRepetition: any[];
}

const StudyPlannerPage: React.FC = () => {
  const { addTask } = useTasks();

  const [request, setRequest] = useState<StudyPlanRequest>({
    subject: '',
    duration: '2 weeks',
    learningStyle: 'mixed',
    hoursAvailable: 12,
  });
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [busy, setBusy] = useState(false);

  const generatePlan = async () => {
    if (!request.subject.trim()) return;

    setBusy(true);
    try {
      const resp = await fetch('/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to generate plan');
      }
      const data = await resp.json();
      setPlan(data.plan as StudyPlan);
      toast.success('Study plan generated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally {
      setBusy(false);
    }
  };

  const addToTasks = async () => {
    if (!plan) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    for (const day of plan.days) {
      const due = new Date(start);
      due.setDate(start.getDate() + (day.day - 1));
      const dueDate = due.toISOString().split('T')[0];

      for (const topic of day.topics) {
        await addTask.mutateAsync({
          text: `Study: ${topic}`,
          column: 'todo',
          priority: 'medium',
          dueDate,
          subtasks: (day.activities || []).slice(0, 5).map((a, i) => ({ id: `s${day.day}-${i}`, text: a, done: false })),
        });
      }
    }

    toast.success('Added study tasks');
  };

  return (
    <PageLayout>
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 max-w-3xl">
        <motion.h1 variants={staggerItem} className="text-2xl font-bold text-foreground">Study Planner</motion.h1>

        {!plan ? (
          <motion.div variants={staggerItem}>
            <GlassCard className="p-6" tilt={false}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Generate a plan</h2>
              </div>

              <label className="text-[11px] text-muted-foreground">Subject / Topic</label>
              <input
                value={request.subject}
                onChange={e => setRequest({ ...request, subject: e.target.value })}
                placeholder="e.g., Calculus: Integration techniques"
                className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[11px] text-muted-foreground">Duration</label>
                  <select
                    value={request.duration}
                    onChange={e => setRequest({ ...request, duration: e.target.value })}
                    className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  >
                    <option>1 week</option>
                    <option>2 weeks</option>
                    <option>1 month</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Hours available / week</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={request.hoursAvailable}
                    onChange={e => setRequest({ ...request, hoursAvailable: Number(e.target.value) })}
                    className="mt-1 w-full px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-[11px] text-muted-foreground">Learning style</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {(['visual', 'text', 'hands-on', 'mixed'] as const).map(s => (
                    <motion.button
                      key={s}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRequest({ ...request, learningStyle: s })}
                      className={`py-2 rounded-xl text-xs font-semibold transition-colors ${
                        request.learningStyle === s
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/[0.04] border border-white/[0.08] text-foreground hover:bg-white/[0.06]'
                      }`}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <label className="text-[11px] text-muted-foreground">Exam date (optional)</label>
                <div className="relative mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={request.examDate || ''}
                    onChange={e => setRequest({ ...request, examDate: e.target.value || undefined })}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-foreground text-sm outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={generatePlan}
                disabled={busy || !request.subject.trim()}
                className="mt-4 w-full py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {busy ? 'Generating…' : 'Generate plan'}
              </motion.button>

              <p className="text-[10px] text-muted-foreground mt-3">
                Uses the backend AI gateway. If AI is in mock mode, you’ll get a basic starter plan.
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <>
            <motion.div variants={staggerItem}>
              <GlassCard className="p-6" tilt={false}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{plan.title}</h2>
                    <p className="text-xs text-muted-foreground">{plan.days.length} days</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={addToTasks}
                    className="px-3 py-2 rounded-xl bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to tasks
                  </motion.button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.days.slice(0, 14).map(d => (
                    <div key={d.day} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-xs font-semibold text-foreground mb-1">Day {d.day} · {d.duration}m</p>
                      <ul className="text-[11px] text-muted-foreground list-disc pl-4 space-y-1">
                        {(d.topics || []).slice(0, 6).map(t => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                      {(d.activities || []).length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Suggested: {d.activities.slice(0, 3).join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPlan(null)}
                    className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-foreground text-xs font-semibold hover:bg-white/[0.06] transition-colors"
                  >
                    Generate another
                  </motion.button>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </motion.div>
    </PageLayout>
  );
};

export default StudyPlannerPage;

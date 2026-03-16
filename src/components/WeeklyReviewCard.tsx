import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/GlassCard';
import { weeklyReviewService, type WeeklyReview } from '@/services/weeklyReviewService';

const LAST_SHOWN_KEY = 'future-weekly-review-last-shown-at';

function formatDelta(n: number) {
  if (!Number.isFinite(n) || n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

const WeeklyReviewCard: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const data = await weeklyReviewService.getWeeklyReview({ withAI: true });
      if (cancelled) return;
      setReview(data);
      setLoading(false);

      try {
        localStorage.setItem(LAST_SHOWN_KEY, new Date().toISOString());
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const headline = useMemo(() => {
    if (!review) return '';
    const d = review.analytics.delta.wellnessScore;
    const direction = d > 0 ? 'up' : d < 0 ? 'down' : 'steady';
    return `Weekly review · readiness ${direction} (${formatDelta(d)})`;
  }, [review]);

  if (loading) {
    return (
      <GlassCard className="p-6" tilt={false}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Weekly review</p>
            </div>
            <div className="h-7 w-56 rounded-xl bg-white/[0.05] border border-white/[0.06]" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded-xl bg-white/[0.04] border border-white/[0.06]" />
              <div className="h-3 w-5/6 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
              <div className="h-3 w-4/6 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/15" />
        </div>
      </GlassCard>
    );
  }

  if (!review) return null;

  const bullets = review.ai?.bullets?.length
    ? review.ai.bullets
    : [
        `Readiness: ${review.analytics.current.wellnessScore}/100 (${formatDelta(review.analytics.delta.wellnessScore)})`,
        `Consistency: ${review.analytics.current.consistencyScore}% (${formatDelta(review.analytics.delta.consistencyScore)})`,
        `Productivity: ${review.analytics.current.productivityIndex}% (${formatDelta(review.analytics.delta.productivityIndex)})`,
      ].slice(0, 3);

  const next = review.ai?.nextStep?.title
    ? {
        title: review.ai.nextStep.title,
        minutes: review.ai.nextStep.minutes,
        route: review.ai.nextStep.route,
      }
    : review.nextActions[0];

  return (
    <GlassCard className="p-6" tilt={false}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Weekly review</p>
          </div>

          <p className="text-sm font-semibold text-foreground">{headline}</p>

          <ul className="mt-3 space-y-1.5">
            {bullets.map((b, i) => (
              <li key={i} className="text-xs text-foreground/90 leading-relaxed">
                {b}
              </li>
            ))}
          </ul>

          {!compact && review.anomalies.length ? (
            <div className="mt-3 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground/90">Notable:</span>{' '}
              {review.anomalies.map(a => a.title).join(' · ')}
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            {next ? (
              <Link
                to={next.route || '/'}
                className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                {next.minutes ? `${next.title} · ${next.minutes}m` : next.title}
              </Link>
            ) : null}

            {!compact && (
              <button
                onClick={() => setDetailsOpen(v => !v)}
                className="px-3 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-foreground hover:bg-white/[0.06] transition-colors"
              >
                Why?
              </button>
            )}

            <Link to="/insights" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              More <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <AnimatePresence>
            {detailsOpen && review.ai?.why?.length ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Why this</p>
                  <ul className="text-[11px] text-muted-foreground space-y-1">
                    {review.ai.why.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                  {review.ai.provider ? (
                    <p className="mt-2 text-[10px] text-muted-foreground inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {review.ai.provider}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="hidden sm:block">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/15 border border-white/[0.08] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default WeeklyReviewCard;

export function getShouldShowWeeklyReview() {
  try {
    const lastShownAt = localStorage.getItem(LAST_SHOWN_KEY);
    return weeklyReviewService.shouldShowThisWeek(lastShownAt);
  } catch {
    return true;
  }
}

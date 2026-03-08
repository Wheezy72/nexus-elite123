import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | null;
  magnetic?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', tilt = true, glow = null, magnetic = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Tilt
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 30 });

  // Magnetic pull — card shifts toward cursor
  const magnetX = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });
  const magnetY = useSpring(useTransform(y, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });

  // Spotlight gradient position
  const spotlightX = useTransform(x, [-0.5, 0.5], [0, 100]);
  const spotlightY = useTransform(y, [-0.5, 0.5], [0, 100]);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if ((!tilt && !magnetic) || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [tilt, magnetic, x, y]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const glowClass = glow ? `glow-${glow}` : '';

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        ...(tilt ? { rotateX, rotateY, transformPerspective: 1000 } : {}),
        ...(magnetic ? { x: magnetX, y: magnetY } : {}),
      }}
      className={`glass-card-premium rounded-3xl overflow-hidden relative ${glowClass} ${className}`}
    >
      {/* Cursor spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(300px circle at ${spotlightX}% ${spotlightY}%, hsl(var(--primary) / 0.07), transparent 60%)`,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  );
};

export default GlassCard;

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive' | null;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', tilt = true, glow = null }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 30 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const glowClass = glow ? `glow-${glow}` : '';

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={tilt ? { rotateX, rotateY, transformPerspective: 1000 } : {}}
      className={`glass-card-premium rounded-3xl overflow-hidden ${glowClass} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

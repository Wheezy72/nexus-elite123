import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', tilt = true }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 });

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

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={tilt ? { rotateX, rotateY, transformPerspective: 1000 } : {}}
      className={`glass-card-premium rounded-2xl overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

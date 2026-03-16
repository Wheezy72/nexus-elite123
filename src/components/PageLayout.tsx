import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface PageLayoutProps {
  children: React.ReactNode;
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 24, scale: 0.97, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
  },
};

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 px-4 sm:px-6 pb-20 pt-6 max-w-7xl mx-auto"
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PageLayout;

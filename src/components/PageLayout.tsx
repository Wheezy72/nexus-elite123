import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import VisionShimmer from './VisionShimmer';
import VideoBg from './VideoBg';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen liquid-mesh-bg text-foreground">
      <div className="aurora-blob" />
      <div className="aurora-blob-2" />
      <div className="noise-overlay" />
      <div className="grid-overlay" />
      <VisionShimmer />
      <VideoBg />
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 px-4 sm:px-6 pb-20 pt-6 max-w-7xl mx-auto"
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PageLayout;

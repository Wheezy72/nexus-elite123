import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import VisionShimmer from './VisionShimmer';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
  const [videoBg] = useLocalStorage<string | null>('nexus-video-bg', null);
  const [videoEnabled] = useLocalStorage<boolean>('nexus-video-enabled', true);
  const [videoOpacity] = useLocalStorage<number>('nexus-video-opacity', 15);
  const [showNoise] = useLocalStorage<boolean>('nexus-show-noise', true);
  const [showGrid] = useLocalStorage<boolean>('nexus-show-grid', true);
  const [showBlobs] = useLocalStorage<boolean>('nexus-show-blobs', true);

  return (
    <div className="min-h-screen liquid-mesh-bg text-foreground">
      {showBlobs && (
        <>
          <div className="aurora-blob" />
          <div className="aurora-blob-2" />
        </>
      )}
      {showNoise && <div className="noise-overlay" />}
      {showGrid && <div className="grid-overlay" />}
      <VisionShimmer />

      {/* Video Background from Settings */}
      {videoBg && videoEnabled && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <video
            src={videoBg}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            style={{ opacity: videoOpacity / 100 }}
          />
        </div>
      )}

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

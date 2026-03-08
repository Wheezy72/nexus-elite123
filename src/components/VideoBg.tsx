import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Video } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const VideoBg: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [enabled, setEnabled] = useLocalStorage<boolean>('nexus-video-bg-on', false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setEnabled(true);
  };

  const remove = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setEnabled(false);
  };

  return (
    <>
      {/* Video element */}
      {enabled && videoUrl && (
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-0 opacity-20"
        />
      )}

      {/* Toggle button - fixed bottom right */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
        {videoUrl ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={remove}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            title="Remove video background"
          >
            <X className="w-4 h-4" />
          </motion.button>
        ) : null}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => videoUrl ? setEnabled(!enabled) : fileRef.current?.click()}
          className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-colors ${enabled && videoUrl ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          title="Video background"
        >
          <Video className="w-4 h-4" />
        </motion.button>
      </div>
    </>
  );
};

export default VideoBg;

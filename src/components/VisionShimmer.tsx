import React, { useState, useEffect, useRef } from 'react';

const INTERVAL = 20 * 60 * 1000; // 20 minutes
const SHIMMER_DURATION = 20 * 1000; // 20 seconds

const VisionShimmer: React.FC = () => {
  const [active, setActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setActive(true);
      setTimeout(() => setActive(false), SHIMMER_DURATION);
    }, INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!active) return null;

  return <div className="vision-shimmer-overlay" />;
};

export default VisionShimmer;

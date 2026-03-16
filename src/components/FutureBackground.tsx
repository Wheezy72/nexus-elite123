import React, { useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import VisionShimmer from '@/components/VisionShimmer';

export type BackgroundStyle = 'aura' | 'static' | 'video';

const FutureBackground: React.FC = () => {
  const [bgStyle] = useLocalStorage<BackgroundStyle>('future-bg-style', 'aura');
  const [videoBg] = useLocalStorage<string | null>('future-video-bg', null);
  const [videoEnabled] = useLocalStorage<boolean>('future-video-enabled', true);
  const [videoOpacity] = useLocalStorage<number>('future-video-opacity', 15);

  const [showNoise] = useLocalStorage<boolean>('future-show-noise', false);
  const [showGrid] = useLocalStorage<boolean>('future-show-grid', false);
  const [showAura] = useLocalStorage<boolean>('future-show-aura', true);

  const [theme, setTheme] = useLocalStorage<string>('future-theme', 'forest');

  useEffect(() => {
    const next = theme === 'indigo' ? 'midnight' : theme;
    const allowed = next === 'forest' || next === 'midnight' || next === 'ivory';

    if (!allowed) {
      setTheme('forest');
      document.documentElement.setAttribute('data-theme', 'forest');
      return;
    }

    if (next !== theme) setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }, [theme, setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-bg-style', bgStyle);
    document.documentElement.setAttribute('data-aura', showAura ? '1' : '0');
    document.documentElement.setAttribute('data-noise', showNoise ? '1' : '0');
    document.documentElement.setAttribute('data-grid', showGrid ? '1' : '0');
  }, [bgStyle, showAura, showNoise, showGrid]);

  return (
    <>
      {/* Base background + aura live in CSS (see index.css). */}
      {showNoise && <div className="noise-overlay" />}
      {showGrid && <div className="grid-overlay" />}
      <VisionShimmer />

      {bgStyle === 'video' && videoBg && videoEnabled && (
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
    </>
  );
};

export default FutureBackground;

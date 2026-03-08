import { useCallback } from 'react';
import PageLayout from '@/components/PageLayout';
import FlowEngine from '@/components/FlowEngine';
import AmbientScenes from '@/components/AmbientScenes';
import PulseBreather from '@/components/PulseBreather';
import FocusStats from '@/components/FocusStats';
import { startAudio, stopAudio, getIsPlaying, type NoiseType } from '@/lib/audioEngine';

const FlowPage = () => {
  const handleApplyScene = useCallback((volumes: Record<NoiseType, number>, tone: number) => {
    localStorage.setItem('nexus-noise-vols', JSON.stringify(volumes));
    localStorage.setItem('nexus-tone', JSON.stringify(tone));
    if (getIsPlaying()) {
      stopAudio();
      startAudio({ noiseVolumes: volumes, tone, customAudioUrl: null, customVolume: 50 });
    }
    window.dispatchEvent(new Event('storage'));
  }, []);

  return (
    <PageLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Flow Engine</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <FlowEngine />
          <PulseBreather />
        </div>
        <div className="space-y-4">
          <AmbientScenes onApplyScene={handleApplyScene} />
          <FocusStats />
        </div>
      </div>
    </PageLayout>
  );
};

export default FlowPage;

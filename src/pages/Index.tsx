import { useCallback } from 'react';
import FlowEngine from '@/components/FlowEngine';
import MicroLogger from '@/components/MicroLogger';
import FeynmanCard from '@/components/FeynmanCard';
import HabitTracker from '@/components/HabitTracker';
import FocusStats from '@/components/FocusStats';
import AmbientScenes from '@/components/AmbientScenes';
import BrainDump from '@/components/BrainDump';
import PulseBreather from '@/components/PulseBreather';
import VisionShimmer from '@/components/VisionShimmer';
import TaskBoard from '@/components/TaskBoard';
import GoalTracker from '@/components/GoalTracker';
import DailyQuotes from '@/components/DailyQuotes';
import SleepTracker from '@/components/SleepTracker';
import { startAudio, stopAudio, getIsPlaying, type NoiseType } from '@/lib/audioEngine';
import { Zap } from 'lucide-react';

const Index = () => {
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
    <div className="min-h-screen liquid-mesh-bg text-foreground">
      <VisionShimmer />

      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Nexus Elite</h1>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <main className="px-4 sm:px-6 pb-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {/* Flow Engine */}
          <div className="lg:row-span-2">
            <FlowEngine />
          </div>

          {/* Mood Logger */}
          <div>
            <MicroLogger />
          </div>

          {/* Daily Quote */}
          <div>
            <DailyQuotes />
          </div>

          {/* Task Board - wide */}
          <div className="lg:col-span-2">
            <TaskBoard />
          </div>

          {/* Ambient Scenes */}
          <div>
            <AmbientScenes onApplyScene={handleApplyScene} />
          </div>

          {/* Habit Tracker - wide */}
          <div className="lg:col-span-2">
            <HabitTracker />
          </div>

          {/* Goal Tracker */}
          <div>
            <GoalTracker />
          </div>

          {/* Brain Dump */}
          <div>
            <BrainDump />
          </div>

          {/* Feynman Card */}
          <div>
            <FeynmanCard />
          </div>

          {/* Pulse Breather */}
          <div>
            <PulseBreather />
          </div>

          {/* Sleep Tracker */}
          <div>
            <SleepTracker />
          </div>

          {/* Focus Stats - wide */}
          <div className="lg:col-span-2">
            <FocusStats />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

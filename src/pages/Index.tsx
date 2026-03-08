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
import Navbar from '@/components/Navbar';
import { startAudio, stopAudio, getIsPlaying, type NoiseType } from '@/lib/audioEngine';

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
      {/* Background layers */}
      <div className="aurora-blob" />
      <div className="noise-overlay" />
      <div className="grid-overlay" />
      <VisionShimmer />

      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="relative z-10 px-4 sm:px-6 pb-10 pt-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {/* Flow Engine */}
          <div id="section-flow" className="lg:row-span-2 scroll-mt-20">
            <FlowEngine />
          </div>

          {/* Mood Logger */}
          <div id="section-mood" className="scroll-mt-20">
            <MicroLogger />
          </div>

          {/* Daily Quote */}
          <div className="scroll-mt-20">
            <DailyQuotes />
          </div>

          {/* Task Board - wide */}
          <div id="section-tasks" className="lg:col-span-2 scroll-mt-20">
            <TaskBoard />
          </div>

          {/* Ambient Scenes */}
          <div className="scroll-mt-20">
            <AmbientScenes onApplyScene={handleApplyScene} />
          </div>

          {/* Habit Tracker - wide */}
          <div id="section-habits" className="lg:col-span-2 scroll-mt-20">
            <HabitTracker />
          </div>

          {/* Goal Tracker */}
          <div id="section-goals" className="scroll-mt-20">
            <GoalTracker />
          </div>

          {/* Brain Dump */}
          <div id="section-journal" className="scroll-mt-20">
            <BrainDump />
          </div>

          {/* Feynman Card */}
          <div className="scroll-mt-20">
            <FeynmanCard />
          </div>

          {/* Pulse Breather */}
          <div className="scroll-mt-20">
            <PulseBreather />
          </div>

          {/* Sleep Tracker */}
          <div id="section-sleep" className="scroll-mt-20">
            <SleepTracker />
          </div>

          {/* Focus Stats - wide */}
          <div className="lg:col-span-2 scroll-mt-20">
            <FocusStats />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

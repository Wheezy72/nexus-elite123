import FlowEngine from '@/components/FlowEngine';
import MicroLogger from '@/components/MicroLogger';
import FeynmanCard from '@/components/FeynmanCard';
import ReadingVelocity from '@/components/ReadingVelocity';
import PulseBreather from '@/components/PulseBreather';
import VisionShimmer from '@/components/VisionShimmer';
import { Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen liquid-mesh-bg text-foreground">
      <VisionShimmer />

      {/* Header */}
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

      {/* Bento Grid */}
      <main className="px-4 sm:px-6 pb-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {/* Flow Engine - large */}
          <div className="lg:row-span-2">
            <FlowEngine />
          </div>

          {/* Micro Logger */}
          <div className="lg:col-span-1">
            <MicroLogger />
          </div>

          {/* Pulse Breather */}
          <div>
            <PulseBreather />
          </div>

          {/* Feynman Card */}
          <div>
            <FeynmanCard />
          </div>

          {/* Reading Velocity - wide */}
          <div className="lg:col-span-2">
            <ReadingVelocity />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

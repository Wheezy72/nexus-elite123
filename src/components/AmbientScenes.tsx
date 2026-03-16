import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, TreePine, Waves, CloudRain, Wind, Moon } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import GlassCard from './GlassCard';
import type { NoiseType } from '@/lib/audioEngine';

export interface ScenePreset {
  id: string;
  name: string;
  icon: React.ElementType;
  volumes: Record<NoiseType, number>;
  tone: number;
  gradient: string;
}

const SCENES: ScenePreset[] = [
  { id: 'coffee', name: 'Coffee Shop', icon: Coffee, volumes: { brown: 60, white: 20, green: 0, rain: 15 }, tone: 55, gradient: 'from-amber-900/20 to-orange-900/10' },
  { id: 'forest', name: 'Forest', icon: TreePine, volumes: { brown: 20, white: 0, green: 70, rain: 30 }, tone: 35, gradient: 'from-emerald-900/20 to-green-900/10' },
  { id: 'ocean', name: 'Ocean', icon: Waves, volumes: { brown: 70, white: 10, green: 0, rain: 0 }, tone: 25, gradient: 'from-cyan-900/20 to-blue-900/10' },
  { id: 'rain', name: 'Heavy Rain', icon: CloudRain, volumes: { brown: 15, white: 5, green: 0, rain: 90 }, tone: 40, gradient: 'from-slate-800/20 to-zinc-900/10' },
  { id: 'wind', name: 'Gentle Wind', icon: Wind, volumes: { brown: 10, white: 40, green: 30, rain: 0 }, tone: 60, gradient: 'from-sky-900/20 to-indigo-900/10' },
  { id: 'night', name: 'Deep Night', icon: Moon, volumes: { brown: 80, white: 0, green: 10, rain: 5 }, tone: 15, gradient: 'from-violet-950/20 to-indigo-950/10' },
];

interface AmbientScenesProps {
  onApplyScene: (volumes: Record<NoiseType, number>, tone: number) => void;
}

const AmbientScenes: React.FC<AmbientScenesProps> = ({ onApplyScene }) => {
  const [activeScene, setActiveScene] = useLocalStorage<string | null>('future-active-scene', null);

  const apply = (scene: ScenePreset) => {
    if (activeScene === scene.id) {
      setActiveScene(null);
      return;
    }
    setActiveScene(scene.id);
    onApplyScene(scene.volumes, scene.tone);
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">Ambient Scenes</h2>
      <div className="grid grid-cols-3 gap-2">
        {SCENES.map(scene => {
          const isActive = activeScene === scene.id;
          return (
            <motion.button
              key={scene.id}
              whileTap={{ scale: 0.9 }}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => apply(scene)}
              className={`relative rounded-xl p-3 flex flex-col items-center gap-2 transition-colors overflow-hidden ${
                isActive ? 'ring-1 ring-primary/40' : 'glass hover:bg-white/[0.08]'
              }`}
            >
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-br ${scene.gradient} pointer-events-none`} />
              )}
              <scene.icon className={`relative z-10 w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`relative z-10 text-[10px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {scene.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default AmbientScenes;

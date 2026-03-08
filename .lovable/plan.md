

# Nexus Elite — Implementation Plan

## Dependencies to Install
- `framer-motion` for all animations (3D tilt, flip cards, spring physics)

## Files to Create

### Foundation
1. **`src/hooks/useLocalStorage.ts`** — Generic hook for localStorage read/write with JSON serialization
2. **`src/lib/audioEngine.ts`** — Web Audio API procedural synthesizer (brown noise + rain generator with density/tone controls)
3. **`src/index.css`** — Update with zinc-950 base, liquid mesh gradient animation, glass utility classes, vision shimmer overlay keyframes

### Components
4. **`src/components/GlassCard.tsx`** — Reusable bento card with `bg-white/5 backdrop-blur-2xl border-white/10`, Framer Motion 3D tilt on hover (cursor-tracked perspective)
5. **`src/components/FlowEngine.tsx`** — Circular SVG Pomodoro timer + procedural audio controls (density/tone sliders) + breathing background sync. Saves sessions to localStorage.
6. **`src/components/MicroLogger.tsx`** — Mood (5 levels) + activity icon grid with spring pop animations. Instant localStorage persistence with timestamps.
7. **`src/components/FeynmanCard.tsx`** — 3D flip card (rotateY) with reflection prompt front / ELI5 textarea back. Stores to "Knowledge Vault" in localStorage. Includes past reflections list.
8. **`src/components/ReadingVelocity.tsx`** — Pages goal input, real-time pages/min + ETA calculation, Recharts line graph of Mental Energy vs Focus Duration from real logged data.
9. **`src/components/PulseBreather.tsx`** — Reset button with expanding/contracting glowing ring animation.
10. **`src/components/VisionShimmer.tsx`** — 20-20-20 rule: tracks app usage time, triggers 20s iridescent overlay (pointer-events: none) every 20 minutes.
11. **`src/components/EmptyState.tsx`** — Premium glass empty state with icon + CTA button.

### Page
12. **`src/pages/Index.tsx`** — Rewrite as responsive bento grid dashboard assembling all modules. Dark theme forced.

## Architecture Notes
- All data flows through `useLocalStorage` hook — no mock data, no backend required
- Charts pull real data from localStorage (mood logs for Mental Energy, flow sessions for Focus Duration)
- Web Audio API synthesizer built from OscillatorNode + noise buffer — zero audio files
- Vision Shimmer runs a global interval timer, rendering a fixed overlay when triggered
- Framer Motion `useMotionValue` + `useTransform` for cursor-tracked 3D tilt on glass cards


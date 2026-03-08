let audioCtx: AudioContext | null = null;
let isPlaying = false;

// Noise sources
let brownSource: AudioBufferSourceNode | null = null;
let whiteSource: AudioBufferSourceNode | null = null;
let greenSource: AudioBufferSourceNode | null = null;
let rainSource: AudioBufferSourceNode | null = null;

// Gains per noise type
let brownGain: GainNode | null = null;
let whiteGain: GainNode | null = null;
let greenGain: GainNode | null = null;
let rainGain: GainNode | null = null;

let filterNode: BiquadFilterNode | null = null;
let masterGain: GainNode | null = null;

// Custom audio
let customElement: HTMLAudioElement | null = null;
let customSource: MediaElementAudioSourceNode | null = null;
let customGain: GainNode | null = null;

export type NoiseType = 'brown' | 'white' | 'green' | 'rain';

export interface AudioConfig {
  noiseVolumes: Record<NoiseType, number>; // 0-100 each
  tone: number; // 0-100
  customAudioUrl: string | null;
  customVolume: number; // 0-100
}

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function createBrownNoise(ctx: AudioContext, duration = 10): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * duration;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

function createWhiteNoise(ctx: AudioContext, duration = 10): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * duration;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buf;
}

function createGreenNoise(ctx: AudioContext, duration = 10): AudioBuffer {
  // Green noise = band-limited noise centered around 500Hz (nature-like)
  const sr = ctx.sampleRate;
  const len = sr * duration;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.0990460;
    b1 = 0.96300 * b1 + white * 0.2965164;
    b2 = 0.57000 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
  }
  return buf;
}

function createRainNoise(ctx: AudioContext, density: number, duration = 10): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * duration;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  const dropRate = Math.max(density, 10) * 0.001;
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() < dropRate
      ? (Math.random() * 2 - 1) * 0.8
      : (Math.random() * 2 - 1) * 0.02;
  }
  return buf;
}

function makeLoopSource(ctx: AudioContext, buffer: AudioBuffer, gain: GainNode, dest: AudioNode) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(gain).connect(dest);
  src.start();
  return src;
}

export function startAudio(config: AudioConfig) {
  if (isPlaying) stopAudio();
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  masterGain = ctx.createGain();
  masterGain.gain.value = 1;

  filterNode = ctx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 200 + config.tone * 40;
  filterNode.connect(masterGain).connect(ctx.destination);

  // Brown
  brownGain = ctx.createGain();
  brownGain.gain.value = config.noiseVolumes.brown / 100 * 0.6;
  brownSource = makeLoopSource(ctx, createBrownNoise(ctx), brownGain, filterNode);

  // White
  whiteGain = ctx.createGain();
  whiteGain.gain.value = config.noiseVolumes.white / 100 * 0.3;
  whiteSource = makeLoopSource(ctx, createWhiteNoise(ctx), whiteGain, filterNode);

  // Green
  greenGain = ctx.createGain();
  greenGain.gain.value = config.noiseVolumes.green / 100 * 0.5;
  greenSource = makeLoopSource(ctx, createGreenNoise(ctx), greenGain, filterNode);

  // Rain
  rainGain = ctx.createGain();
  rainGain.gain.value = config.noiseVolumes.rain / 100 * 0.6;
  rainSource = makeLoopSource(ctx, createRainNoise(ctx, config.noiseVolumes.rain), rainGain, filterNode);

  // Custom audio file
  if (config.customAudioUrl) {
    customElement = new Audio(config.customAudioUrl);
    customElement.loop = true;
    customElement.crossOrigin = 'anonymous';
    customSource = ctx.createMediaElementSource(customElement);
    customGain = ctx.createGain();
    customGain.gain.value = config.customVolume / 100;
    customSource.connect(customGain).connect(masterGain);
    customElement.play().catch(() => {});
  }

  isPlaying = true;
}

export function updateAudio(config: AudioConfig) {
  if (filterNode) filterNode.frequency.value = 200 + config.tone * 40;
  if (brownGain) brownGain.gain.value = config.noiseVolumes.brown / 100 * 0.6;
  if (whiteGain) whiteGain.gain.value = config.noiseVolumes.white / 100 * 0.3;
  if (greenGain) greenGain.gain.value = config.noiseVolumes.green / 100 * 0.5;
  if (rainGain) rainGain.gain.value = config.noiseVolumes.rain / 100 * 0.6;
  if (customGain) customGain.gain.value = config.customVolume / 100;
}

export function pauseAudio() {
  if (!audioCtx || !isPlaying) return;
  audioCtx.suspend();
}

export function resumeAudio() {
  if (!audioCtx || !isPlaying) return;
  audioCtx.resume();
}

export function stopAudio() {
  try { brownSource?.stop(); } catch {}
  try { whiteSource?.stop(); } catch {}
  try { greenSource?.stop(); } catch {}
  try { rainSource?.stop(); } catch {}
  try { customElement?.pause(); customElement = null; } catch {}
  brownSource = whiteSource = greenSource = rainSource = null;
  brownGain = whiteGain = greenGain = rainGain = null;
  customSource = null;
  customGain = null;
  filterNode = null;
  masterGain = null;
  isPlaying = false;
}

export function getIsPlaying() { return isPlaying; }

let audioCtx: AudioContext | null = null;
let brownSource: AudioBufferSourceNode | null = null;
let brownGain: GainNode | null = null;
let rainSource: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let isPlaying = false;

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

function createRainNoise(ctx: AudioContext, density: number, duration = 10): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * duration;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  const dropRate = density * 0.001;
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() < dropRate
      ? (Math.random() * 2 - 1) * 0.8
      : (Math.random() * 2 - 1) * 0.02;
  }
  return buf;
}

export function startAudio(density = 50, tone = 50) {
  if (isPlaying) updateAudio(density, tone);
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();

  filterNode = ctx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = 200 + tone * 40;
  filterNode.connect(ctx.destination);

  const brownBuf = createBrownNoise(ctx);
  brownSource = ctx.createBufferSource();
  brownSource.buffer = brownBuf;
  brownSource.loop = true;
  brownGain = ctx.createGain();
  brownGain.gain.value = 0.4;
  brownSource.connect(brownGain).connect(filterNode);
  brownSource.start();

  const rainBuf = createRainNoise(ctx, density);
  rainSource = ctx.createBufferSource();
  rainSource.buffer = rainBuf;
  rainSource.loop = true;
  rainGain = ctx.createGain();
  rainGain.gain.value = 0.3 + (density / 100) * 0.5;
  rainSource.connect(rainGain).connect(filterNode);
  rainSource.start();

  isPlaying = true;
}

export function updateAudio(density: number, tone: number) {
  if (filterNode) filterNode.frequency.value = 200 + tone * 40;
  if (rainGain) rainGain.gain.value = 0.3 + (density / 100) * 0.5;
}

export function stopAudio() {
  try { brownSource?.stop(); } catch {}
  try { rainSource?.stop(); } catch {}
  brownSource = null;
  rainSource = null;
  brownGain = null;
  rainGain = null;
  filterNode = null;
  isPlaying = false;
}

export function getIsPlaying() { return isPlaying; }

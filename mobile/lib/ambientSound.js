import { useRef, useState } from 'react';
import { Platform } from 'react-native';

export const SOUND_OPTIONS = [
  { id: 'off',   label: 'Silence',     icon: '🔇' },
  { id: 'white', label: 'Bruit blanc', icon: '🌊' },
  { id: 'brown', label: 'Pluie',       icon: '🌧️' },
  { id: 'pink',  label: 'Lo-fi',       icon: '🎵' },
];

function generateNoise(ctx, type) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * w) / 1.02;
      last = data[i];
      data[i] *= 3.5;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buffer;
}

export function useAmbientSound() {
  const [active, setActive] = useState('off');
  const refs = useRef({ ctx: null, source: null, gain: null });

  const stop = () => {
    if (refs.current.source) {
      try { refs.current.source.stop(); } catch {}
    }
    if (refs.current.ctx) {
      try { refs.current.ctx.close(); } catch {}
    }
    refs.current = { ctx: null, source: null, gain: null };
    setActive('off');
  };

  const play = (type) => {
    if (Platform.OS !== 'web') return;
    stop();
    if (type === 'off') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const buffer = generateNoise(ctx, type);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = 0.15;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      refs.current = { ctx, source, gain };
      setActive(type);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  };

  const setVolume = (v) => {
    if (refs.current.gain) refs.current.gain.gain.value = v;
  };

  return { active, play, stop, setVolume };
}

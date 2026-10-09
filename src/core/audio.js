// Motor de audio WebAudio: efectos sintetizados + loop musical. Sin archivos externos.
import { storage } from './storage.js';

let ctx = null, master = null, musicGain = null, musicTimer = null, musicStep = 0;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

const on = () => storage.get('sound') !== false;

function tone({ freq = 440, freqEnd = null, dur = 0.15, type = 'sine', vol = 0.5, when = 0, dest = null }) {
  const c = ac(); if (!c || !on()) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.2, vol = 0.4, from = 1200, to = 200, when = 0, type = 'lowpass' }) {
  const c = ac(); if (!c || !on()) return;
  const t0 = c.currentTime + when;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type;
  f.frequency.setValueAtTime(from, t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur);
}

export const audio = {
  unlock() { ac(); },
  click()  { tone({ freq: 660, dur: 0.07, type: 'triangle', vol: 0.35 }); },
  blip(freq) { tone({ freq, dur: 0.16, type: 'sine', vol: 0.5 }); tone({ freq: freq * 2, dur: 0.1, type: 'sine', vol: 0.14 }); },
  star()   { [880, 1108, 1318].forEach((f, i) => tone({ freq: f, dur: 0.12, type: 'triangle', vol: 0.4, when: i * 0.06 })); },
  jump()   { noise({ dur: 0.16, vol: 0.12, from: 500, to: 2400, type: 'bandpass' }); tone({ freq: 240, freqEnd: 520, dur: 0.14, type: 'sine', vol: 0.25 }); },
  hit()    { noise({ dur: 0.25, vol: 0.5, from: 900, to: 90 }); tone({ freq: 140, freqEnd: 45, dur: 0.3, type: 'sawtooth', vol: 0.4 }); },
  combo()  { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.14, type: 'square', vol: 0.22, when: i * 0.055 })); },
  coin()   { tone({ freq: 1320, dur: 0.07, type: 'square', vol: 0.2 }); tone({ freq: 1760, dur: 0.09, type: 'square', vol: 0.16, when: 0.05 }); },
  ring()   { tone({ freq: 1046, dur: 0.3, type: 'sine', vol: 0.4 }); tone({ freq: 1568, dur: 0.24, type: 'sine', vol: 0.22, when: 0.07 }); },
  ability(){ tone({ freq: 330, freqEnd: 990, dur: 0.22, type: 'sawtooth', vol: 0.22 }); tone({ freq: 660, dur: 0.16, type: 'triangle', vol: 0.25, when: 0.1 }); },
  deny()   { tone({ freq: 180, freqEnd: 120, dur: 0.16, type: 'square', vol: 0.2 }); },
  cardFound() { [784, 988, 1175, 1568].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'triangle', vol: 0.32, when: i * 0.09 })); },
  buy()    { tone({ freq: 880, dur: 0.1, type: 'triangle', vol: 0.3 }); tone({ freq: 1174, dur: 0.16, type: 'triangle', vol: 0.28, when: 0.08 }); },
  day()    { tone({ freq: 523, dur: 0.12, type: 'triangle', vol: 0.4 }); tone({ freq: 784, dur: 0.2, type: 'triangle', vol: 0.4, when: 0.1 }); },
  win()    { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.4, when: i * 0.12 })); },
  lose()   { [392, 330, 262, 196].forEach((f, i) => tone({ freq: f, dur: 0.3, type: 'sawtooth', vol: 0.22, when: i * 0.16 })); },

  // Loop musical mínimo: bajo + hat a 104 BPM, sólo durante el juego
  musicStart() {
    const c = ac(); if (!c || musicTimer) return;
    const bassline = [110, 110, 131, 98]; // La2, La2, Do3, Sol2
    musicStep = 0;
    const stepDur = 60 / 104 / 2; // corcheas
    musicTimer = setInterval(() => {
      if (!on()) return;
      const bar = Math.floor(musicStep / 8) % 4;
      const s = musicStep % 8;
      if (s % 4 === 0) tone({ freq: bassline[bar], dur: stepDur * 3.4, type: 'sawtooth', vol: 0.5, dest: musicGain });
      if (s % 2 === 1) noise({ dur: 0.05, vol: 0.05, from: 6000, to: 4000, type: 'highpass' });
      musicStep++;
    }, stepDur * 1000);
  },
  musicStop() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } },
};

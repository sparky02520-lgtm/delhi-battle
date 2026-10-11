// Procedural sound, no audio files needed. To use real files later, replace the
// bodies of sfx()/startMusic() with playback from public/assets/audio/.
export class AudioService {
  constructor(getSettings) {
    this.getSettings = getSettings;
    this.ctx = null;
    this.timer = null;
    this.step = 0;
  }
  // Call from a user gesture (click/tap/key) because of browser autoplay rules.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.apply();
  }
  apply() {
    if (!this.ctx) return;
    const s = this.getSettings();
    this.musicGain.gain.value = s.muted ? 0 : s.music * 0.25;
    this.sfxGain.gain.value = s.muted ? 0 : s.sfx;
  }
  tone({ type = 'sine', f = 440, f2 = null, dur = 0.12, vol = 0.3, delay = 0, music = false }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(music ? this.musicGain : this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur = 0.3, vol = 0.4) {
    if (!this.ctx) return;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
    src.buffer = buf; g.gain.value = vol; src.connect(g); g.connect(this.sfxGain); src.start();
  }
  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'click': this.tone({ type: 'square', f: 520, f2: 760, dur: 0.06, vol: 0.12 }); break;
      case 'coin': this.tone({ f: 880, dur: 0.07, vol: 0.25 }); this.tone({ f: 1320, dur: 0.12, vol: 0.25, delay: 0.06 }); break;
      case 'jump': this.tone({ f: 300, f2: 700, dur: 0.18, vol: 0.25 }); break;
      case 'land': this.tone({ type: 'triangle', f: 140, f2: 60, dur: 0.1, vol: 0.3 }); break;
      case 'slide': this.noise(0.18, 0.15); break;
      case 'lane': this.tone({ type: 'triangle', f: 400, f2: 500, dur: 0.06, vol: 0.12 }); break;
      case 'ability': this.tone({ type: 'sawtooth', f: 200, f2: 900, dur: 0.4, vol: 0.2 }); this.tone({ type: 'square', f: 600, f2: 1200, dur: 0.3, vol: 0.1, delay: 0.1 }); break;
      case 'crash': this.noise(0.5, 0.6); this.tone({ type: 'sawtooth', f: 200, f2: 40, dur: 0.5, vol: 0.3 }); break;
      case 'result': [523, 659, 784, 1046].forEach((f, i) => this.tone({ type: 'triangle', f, dur: 0.18, vol: 0.25, delay: i * 0.1 })); break;
      default: break;
    }
  }
  startMusic() {
    if (!this.ctx || this.timer) return;
    const scale = [0, 3, 5, 7, 10, 12, 10, 7];
    this.timer = setInterval(() => {
      const note = 220 * Math.pow(2, scale[this.step % 8] / 12);
      this.tone({ type: 'triangle', f: note, dur: 0.18, vol: 0.5, music: true });
      if (this.step % 4 === 0) this.tone({ f: 82, dur: 0.35, vol: 0.8, music: true });
      this.step++;
    }, 230);
  }
  stopMusic() { clearInterval(this.timer); this.timer = null; }
}

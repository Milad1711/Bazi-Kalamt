// ============ Procedural Audio Engine (WebAudio — no external files) ============
export type MusicTrack = 'lobby' | 'game';
export type SfxName =
  | 'click' | 'pop' | 'letter' | 'word' | 'wrong' | 'coin' | 'flip'
  | 'match' | 'mismatch' | 'levelup' | 'victory' | 'defeat' | 'box' | 'hint' | 'star' | 'tick';

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// C major pentatonic (midi): C D E G A
const PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
// Lobby: C - G - Am - F (bass midi roots)
const LOBBY_CHORDS: number[][] = [
  [48, 55, 60, 64], // C
  [43, 55, 59, 62], // G
  [45, 57, 60, 64], // Am
  [41, 53, 57, 60], // F
];
// Game: Dm - Bb - F - C (energetic)
const GAME_CHORDS: number[][] = [
  [50, 57, 62, 65],
  [46, 58, 62, 65],
  [41, 53, 57, 60],
  [48, 55, 60, 64],
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private track: MusicTrack | null = null;
  private musicEnabled = true;
  private sfxEnabled = true;
  private hapticsEnabled = true;
  private noiseBuffer: AudioBuffer | null = null;
  private lastMelody = 72;

  /** Must be called from a user gesture */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.5 : 0;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.9 : 0;
      this.sfxGain.connect(this.master);
      // noise buffer for percussion/flips
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      if (this.track) this.playMusic(this.track);
    } catch {
      // audio unsupported
    }
  }

  setMusicEnabled(on: boolean) {
    this.musicEnabled = on;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.05);
    }
  }

  setSfxEnabled(on: boolean) {
    this.sfxEnabled = on;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.02);
    }
  }

  setHaptics(on: boolean) {
    this.hapticsEnabled = on;
  }

  vibrate(pattern: number | number[] = 15) {
    if (!this.hapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
    } catch { /* ignore */ }
  }

  playMusic(track: MusicTrack) {
    this.track = track;
    if (!this.ctx || !this.musicEnabled) return;
    this.stopScheduler();
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.schedulerId = setInterval(() => this.scheduler(), 60);
  }

  stopMusic() {
    this.track = null;
    this.stopScheduler();
  }

  private stopScheduler() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  private scheduler() {
    if (!this.ctx) return;
    const isGame = this.track === 'game';
    const stepDur = isGame ? 60 / 104 / 2 : 60 / 84 / 2; // 8th notes
    while (this.nextNoteTime < this.ctx.currentTime + 0.25) {
      this.scheduleStep(this.step, this.nextNoteTime, stepDur, isGame);
      this.nextNoteTime += stepDur;
      this.step = (this.step + 1) % 64; // 8 bars of 8 steps
    }
  }

  private scheduleStep(step: number, t: number, dur: number, isGame: boolean) {
    const chords = isGame ? GAME_CHORDS : LOBBY_CHORDS;
    const bar = Math.floor(step / 8) % 4;
    const beat = step % 8;
    const chord = chords[bar];

    // Bass on beats 0 and 4
    if (beat === 0 || beat === 4) {
      this.note(midi(chord[0] - 12), t, dur * 1.8, 'triangle', 0.16, this.musicGain);
    }
    // Pad at bar start (sustained)
    if (beat === 0) {
      for (let i = 1; i < chord.length; i++) {
        this.note(midi(chord[i]), t, dur * 7.5, 'sine', 0.05, this.musicGain, 0.6, 1.2);
      }
    }
    // Melody: gentle random walk on pentatonic
    const melodyChance = isGame ? 0.42 : 0.26;
    if (Math.random() < melodyChance && (beat === 1 || beat === 3 || beat === 5 || beat === 6)) {
      const jump = Math.floor(Math.random() * 5) - 2;
      this.lastMelody = Math.max(64, Math.min(84, this.lastMelody + jump));
      const noteMidi = PENTA.includes(this.lastMelody) ? this.lastMelody : PENTA.reduce((a, b) => Math.abs(b - this.lastMelody) < Math.abs(a - this.lastMelody) ? b : a);
      this.note(midi(noteMidi + (isGame ? 12 : 12)), t, dur * 0.9, isGame ? 'triangle' : 'sine', isGame ? 0.075 : 0.055, this.musicGain);
    }
    // Percussion (game track only, subtle)
    if (isGame) {
      if (beat === 0 || beat === 4) this.kick(t);
      if (beat === 2 || beat === 6) this.hat(t, 0.03);
      if (beat === 7) this.hat(t, 0.018);
    }
  }

  private note(
    freq: number,
    t: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    dest: GainNode | null,
    attack = 0.01,
    release = 0.14,
  ) {
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
    g.gain.linearRampToValueAtTime(0, t + dur + release);
    osc.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + release + 0.05);
  }

  private kick(t: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private hat(t: number, gain: number) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.musicGain);
    src.start(t);
    src.stop(t + 0.06);
  }

  // ---------- SFX ----------
  sfx(name: SfxName, param = 0) {
    if (!this.ctx || !this.sfxEnabled || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const d = this.sfxGain;
    switch (name) {
      case 'click':
        this.note(660, t, 0.05, 'square', 0.08, d, 0.005, 0.03);
        break;
      case 'tick':
        this.note(880, t, 0.03, 'sine', 0.05, d);
        break;
      case 'pop':
        this.sweep(320, 560, t, 0.09, 'sine', 0.14, d);
        break;
      case 'letter': {
        const f = 440 * Math.pow(1.06, Math.min(param, 10));
        this.note(f, t, 0.05, 'sine', 0.07, d);
        break;
      }
      case 'word': {
        const base = [523.25, 659.25, 783.99, 1046.5];
        base.forEach((f, i) => this.note(f, t + i * 0.07, 0.12, 'triangle', 0.11, d, 0.005, 0.1));
        break;
      }
      case 'wrong':
        this.note(160, t, 0.18, 'sawtooth', 0.07, d, 0.005, 0.12);
        this.note(120, t + 0.06, 0.2, 'sawtooth', 0.06, d, 0.005, 0.12);
        break;
      case 'coin':
        this.note(1244, t, 0.07, 'square', 0.06, d, 0.002, 0.05);
        this.note(1864, t + 0.06, 0.16, 'square', 0.06, d, 0.002, 0.12);
        break;
      case 'flip':
        this.noise(t, 0.05, 2600, 0.1, d);
        break;
      case 'match':
        this.note(987.77, t, 0.1, 'triangle', 0.12, d);
        this.note(1318.5, t + 0.08, 0.18, 'triangle', 0.11, d);
        break;
      case 'mismatch':
        this.note(392, t, 0.12, 'triangle', 0.1, d);
        this.note(311, t + 0.1, 0.18, 'triangle', 0.1, d);
        break;
      case 'levelup': {
        [523, 587, 659, 784, 1046].forEach((f, i) =>
          this.note(f, t + i * 0.09, 0.15, 'triangle', 0.12, d, 0.005, 0.12));
        break;
      }
      case 'victory': {
        const notes = [523, 659, 784, 1046];
        notes.forEach((f, i) => this.note(f, t + i * 0.12, 0.22, 'triangle', 0.13, d, 0.005, 0.16));
        [523, 659, 784].forEach((f) => this.note(f, t + 0.55, 0.6, 'sine', 0.07, d, 0.05, 0.3));
        break;
      }
      case 'defeat': {
        [392, 349, 311, 261].forEach((f, i) => this.note(f, t + i * 0.16, 0.2, 'triangle', 0.1, d, 0.01, 0.18));
        break;
      }
      case 'box':
        this.noiseSweep(t, 0.4, d);
        [880, 1108, 1318, 1760].forEach((f, i) =>
          this.note(f, t + 0.25 + i * 0.08, 0.14, 'sine', 0.09, d, 0.005, 0.1));
        break;
      case 'hint':
        this.note(1567, t, 0.25, 'sine', 0.08, d, 0.01, 0.2);
        this.note(2093, t + 0.08, 0.3, 'sine', 0.06, d, 0.01, 0.25);
        break;
      case 'star':
        this.note(1318, t, 0.08, 'sine', 0.1, d);
        this.note(1760, t + 0.05, 0.14, 'sine', 0.09, d);
        break;
    }
  }

  private sweep(f0: number, f1: number, t: number, dur: number, type: OscillatorType, gain: number, d: GainNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(d);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(t: number, dur: number, freq: number, gain: number, d: GainNode) {
    if (!this.ctx || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(d);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private noiseSweep(t: number, dur: number, d: GainNode) {
    if (!this.ctx || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(3200, t + dur);
    f.Q.value = 1.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(d);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
}

export const audio = new AudioEngine();

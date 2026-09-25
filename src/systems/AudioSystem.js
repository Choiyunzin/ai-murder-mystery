/**
 * Web Audio 로 직접 합성하는 BGM / 효과음. 외부 오디오 파일이 필요 없다.
 * 브라우저 정책상 첫 사용자 입력(unlock) 이후에만 소리가 난다.
 */
const MUTE_KEY = 'case026.muted';

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// 모드별 BGM: 코드 진행(MIDI), 마디 길이(초), 볼륨, 필터
const MUSIC = {
  menu: { chords: [[57, 60, 64, 71], [53, 57, 60, 64], [50, 57, 60, 65], [52, 56, 59, 62]], bar: 4.5, vol: 0.07, cutoff: 1400, pluck: true },
  lobby: { chords: [[57, 60, 64, 71], [53, 57, 60, 64], [50, 57, 60, 65], [52, 56, 59, 62]], bar: 4, vol: 0.07, cutoff: 1500, pluck: true },
  room: { chords: [[57, 60, 64, 71], [53, 57, 60, 64], [50, 57, 60, 65], [52, 56, 59, 62]], bar: 4, vol: 0.04, cutoff: 1100, pluck: false },
  exec: { chords: [[48, 51, 55, 58], [44, 48, 51, 55], [41, 44, 48, 51], [43, 47, 50, 56]], bar: 3.5, vol: 0.065, cutoff: 900, pluck: false, pulse: true },
  deduction: { chords: [[45, 52]], bar: 6, vol: 0.045, cutoff: 700, pluck: false },
  solved: { chords: [[48, 55, 60, 64], [53, 57, 60, 65], [55, 59, 62, 67], [48, 55, 64, 71]], bar: 3.5, vol: 0.06, cutoff: 1800, pluck: true, intro: [60, 64, 67, 72, 76] },
  unsolved: { chords: [[45, 52, 57, 60], [43, 50, 55, 59], [41, 48, 53, 57], [40, 47, 52, 56]], bar: 5, vol: 0.05, cutoff: 900, pluck: false, intro: [76, 72, 69, 64, 57] }
};

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.mode = null;
    this.timer = null;
    this.listeners = new Set();
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
  }

  get ready() {
    return !!this.ctx;
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);
      this.noise = this.makeNoise();
      if (this.mode) this.startMusic(this.mode);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setMuted(muted) {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* 저장 불가 환경 */
    }
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    this.listeners.forEach((fn) => fn(muted));
  }

  toggleMute() {
    this.unlock();
    this.setMuted(!this.muted);
  }

  // ── BGM ───────────────────────────────
  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    if (this.ctx) this.startMusic(mode);
  }

  startMusic(mode) {
    const cfg = MUSIC[mode];
    clearInterval(this.timer);
    const now = this.ctx.currentTime;
    // 이전 곡은 짧게 페이드아웃, 새 곡 버스로 교체
    const old = this.music;
    old.gain.setTargetAtTime(0, now, 0.4);
    setTimeout(() => old.disconnect(), 2500);
    this.music = this.ctx.createGain();
    this.music.gain.value = 0;
    this.music.gain.setTargetAtTime(cfg.vol, now + 0.1, 0.8);
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = cfg.cutoff;
    this.filter.connect(this.music);
    this.music.connect(this.master);

    let next = now + 0.15;
    if (cfg.intro) {
      cfg.intro.forEach((m, i) => this.tone(mtof(m), next + i * 0.22, 0.9, 'triangle', 0.5, this.sfxBus));
      next += cfg.intro.length * 0.22 + 0.4;
    }
    let bar = 0;
    const schedule = () => {
      while (next < this.ctx.currentTime + 1.2) {
        const chord = cfg.chords[bar % cfg.chords.length];
        chord.forEach((m) => this.pad(mtof(m), next, cfg.bar * 1.15));
        this.pad(mtof(chord[0] - 12), next, cfg.bar * 1.1, 'sine', 0.9);
        if (cfg.pluck) {
          const pick = [chord[1] + 12, chord[2] + 12, chord[3 % chord.length] + 12];
          [0.5, 1.75, 2.75].forEach((t, i) => Math.random() < 0.7 && this.tone(mtof(pick[i % pick.length]), next + t * (cfg.bar / 4), 1.2, 'sine', 0.35, this.filter));
        }
        if (cfg.pulse) for (let i = 0; i < 4; i++) this.tone(mtof(chord[0] - 12), next + (i * cfg.bar) / 4, 0.25, 'triangle', 0.5, this.filter);
        next += cfg.bar;
        bar++;
      }
    };
    schedule();
    this.timer = setInterval(schedule, 300);
  }

  pad(freq, at, dur, type = 'triangle', vol = 0.35) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + dur * 0.3);
    g.gain.linearRampToValueAtTime(0, at + dur);
    o.connect(g).connect(this.filter);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  // ── 효과음 ─────────────────────────────
  tone(freq, at, dur, type = 'sine', vol = 0.3, dest = this.sfxBus, slideTo = null) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(dest);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 0.5;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  noiseBurst(at, dur, freq, vol, type = 'bandpass') {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(at, Math.random() * 0.3);
    src.stop(at + dur);
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'step':
        this.noiseBurst(t, 0.07, 700 + Math.random() * 300, 0.12);
        break;
      case 'door':
        this.tone(90, t, 0.25, 'sine', 0.5);
        this.noiseBurst(t, 0.18, 400, 0.25, 'lowpass');
        this.tone(320, t + 0.05, 0.35, 'sawtooth', 0.03, this.sfxBus, 180);
        break;
      case 'knock':
        [0, 0.18].forEach((d) => {
          this.tone(140, t + d, 0.12, 'sine', 0.5);
          this.noiseBurst(t + d, 0.08, 900, 0.2);
        });
        break;
      case 'ting':
        this.tone(1320, t, 0.25, 'sine', 0.12);
        break;
      case 'open':
        this.tone(660, t, 0.18, 'triangle', 0.15);
        this.tone(880, t + 0.08, 0.22, 'triangle', 0.15);
        break;
      case 'blip':
        this.tone(520 + Math.random() * 80, t, 0.05, 'square', 0.035);
        break;
      case 'select':
        this.tone(740, t, 0.08, 'triangle', 0.14);
        break;
      case 'evidence':
        [60, 64, 67, 72].forEach((m, i) => this.tone(mtof(m + 12), t + i * 0.09, 0.35, 'triangle', 0.2));
        break;
      case 'clue':
        this.tone(mtof(79), t, 0.25, 'sine', 0.18);
        this.tone(mtof(84), t + 0.1, 0.35, 'sine', 0.18);
        break;
      case 'contradiction':
        [0, 1, 2].forEach((i) => this.tone(mtof([57, 60, 64][i]), t, 0.8, 'sawtooth', 0.07));
        this.tone(mtof(45), t, 0.9, 'sine', 0.4);
        this.noiseBurst(t, 0.3, 2000, 0.15, 'highpass');
        break;
      case 'unlock':
        [67, 71, 74, 79].forEach((m, i) => this.tone(mtof(m), t + i * 0.08, 0.4, 'sine', 0.2));
        break;
      case 'warning':
        this.tone(110, t, 0.35, 'sawtooth', 0.1);
        this.tone(104, t + 0.2, 0.35, 'sawtooth', 0.1);
        break;
      case 'wrong':
        this.tone(160, t, 0.5, 'square', 0.08, this.sfxBus, 110);
        break;
      case 'correct':
        [72, 76, 79].forEach((m, i) => this.tone(mtof(m), t + i * 0.1, 0.6, 'triangle', 0.18));
        break;
      default:
    }
  }
}

export const audio = new AudioSystem();

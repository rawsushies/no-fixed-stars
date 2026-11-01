import type { CosmicStage } from './astronomyLogic';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private isMuted = false;
  private isPaused = false;
  private volume = 0.65;
  private currentStage: CosmicStage = 1;
  private initialized = false;

  public initOnInteraction(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended' && !this.isPaused) {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.setupAmbience();
      this.initialized = true;
    } catch {
      // Web Audio blocked or unavailable in headless environment
    }
  }

  private setupAmbience(): void {
    if (!this.ctx || !this.masterGain) return;

    // 1. High-altitude mountain wind (filtered brown/pink noise)
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.18;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 260;
    windFilter.Q.value = 1.8;

    // Slow LFO modulating wind gusts
    const windLfo = this.ctx.createOscillator();
    windLfo.frequency.value = 0.11;
    const windLfoGain = this.ctx.createGain();
    windLfoGain.gain.value = 110;
    windLfo.connect(windFilter.frequency);
    windLfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.22;

    whiteNoise.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    whiteNoise.start();

    // 2. Restrained low-frequency observatory tonal ambience
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc2.type = 'triangle';

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 160;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.12;

    this.droneOsc1.connect(droneFilter);
    this.droneOsc2.connect(droneFilter);
    droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.updateStageHarmonics(this.currentStage);
  }

  public setCosmicStage(stage: CosmicStage): void {
    this.currentStage = stage;
    this.updateStageHarmonics(stage);
  }

  private updateStageHarmonics(stage: CosmicStage): void {
    if (!this.ctx || !this.droneOsc1 || !this.droneOsc2 || !this.droneGain) return;
    const now = this.ctx.currentTime;
    // Stage 1: Peaceful D1 + A1 fifth (73.42Hz, 110Hz)
    // Stage 2: Suspended unsettling fourth (73.42Hz, 98.0Hz)
    // Stage 3: Tritone beating (73.42Hz, 103.83Hz)
    // Stage 4: Deep sub-audible abyssal dissonance (55Hz, 58.27Hz)
    const freqs: Record<CosmicStage, [number, number, number]> = {
      1: [73.42, 110.0, 0.10],
      2: [73.42, 97.99, 0.13],
      3: [65.41, 92.50, 0.16],
      4: [55.0, 58.27, 0.22],
    };
    const [f1, f2, gain] = freqs[stage];
    this.droneOsc1.frequency.setTargetAtTime(f1, now, 1.5);
    this.droneOsc2.frequency.setTargetAtTime(f2, now, 1.5);
    this.droneGain.gain.setTargetAtTime(gain, now, 1.5);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.syncMasterGain();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    this.syncMasterGain();
  }

  public getVolume(): number {
    return this.volume;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.syncMasterGain();
  }

  private syncMasterGain(): void {
    if (!this.ctx || !this.masterGain) return;
    const target = this.isMuted || this.isPaused ? 0 : this.volume;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  }

  /** Mechanical brass vernier click (pitch-varied ±6%) */
  public playVernierTick(weight: 'light' | 'medium' = 'light'): void {
    this.initOnInteraction();
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitchVar = 0.94 + Math.random() * 0.12;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime((weight === 'light' ? 520 : 380) * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.045);

    gain.gain.setValueAtTime(weight === 'light' ? 0.08 : 0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Photographic glass plate shutter clack & exposure chime */
  public playPlateShutter(isAnomaly: boolean): void {
    this.initOnInteraction();
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const now = this.ctx.currentTime;
    // Mechanical brass leaf-shutter double click
    [0, 0.14].forEach((offset, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx === 0 ? 280 : 210, now + offset);
      osc.frequency.exponentialRampToValueAtTime(65, now + offset + 0.06);

      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.065);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });

    // Subtle resonant glass harmonic
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(isAnomaly ? 415.3 : 528.0, now + 0.16);
    chime.frequency.exponentialRampToValueAtTime(isAnomaly ? 207.65 : 528.0, now + 1.4);

    chimeGain.gain.setValueAtTime(0.12, now + 0.16);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chime.start(now + 0.16);
    chime.stop(now + 1.5);
  }

  /** Cosmic revelation low-frequency resonance */
  public playAnomalyRevelation(): void {
    this.initOnInteraction();
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const now = this.ctx.currentTime;
    const freqs = [55.0, 82.41, 116.54, 233.08]; // A1, E2, Bb2 (tritone), Bb3
    freqs.forEach((f) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 0.96, now + 3.5);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 3.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 3.9);
    });
  }
}

export const soundEngine = new SoundEngine();

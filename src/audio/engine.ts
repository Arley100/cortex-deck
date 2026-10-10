/**
 * Everything audible in the app, synthesized on the fly with Web Audio: no
 * audio files, no network. Two independent switches:
 *
 * - sfx: short acknowledgements of the user's own input and results. Sounds
 *   never announce a stimulus (no tone when the Reaction panel turns green,
 *   none during Sequence playback), so timing and memory measurements stay
 *   comparable with silent runs.
 * - ambient: a low drone with a 6 Hz binaural offset and slow swells. It is
 *   offered as a backdrop some people find settling; the app makes no claim
 *   that it changes scores.
 *
 * Browsers only allow audio after a user gesture, so the context is created
 * lazily and resumed on the first pointer or key press.
 */

export type SfxName = "tap" | "good" | "bad" | "clap" | "chime" | "lift" | "toggle";

type AudioCtor = typeof AudioContext;

function audioCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** swells every ~11 s: roughly 5 to 6 per minute, a slow breathing pace */
export const AMBIENT_SWELL_HZ = 0.09;
/** left and right carriers differ by this much; audible as a beat on headphones */
export const BINAURAL_OFFSET_HZ = 6;

interface AmbientVoice {
  stop: () => void;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ambientVoice: AmbientVoice | null = null;
  private sfxOn = true;
  private ambientOn = false;
  private unlockBound = false;

  /** true when the platform has Web Audio at all */
  get supported(): boolean {
    return audioCtor() !== null;
  }

  setSfx(on: boolean): void {
    this.sfxOn = on;
  }

  setAmbient(on: boolean): void {
    this.ambientOn = on;
    if (!on) {
      this.ambientVoice?.stop();
      this.ambientVoice = null;
      return;
    }
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "running") this.startAmbient();
    else this.waitForGesture();
  }

  play(name: SfxName): void {
    if (!this.sfxOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.master || ctx.state !== "running") return;
    const t = ctx.currentTime;
    switch (name) {
      case "tap":
        this.blip(t, 760, 560, 0.05, 0.035, "sine");
        break;
      case "toggle":
        this.blip(t, 520, 780, 0.07, 0.04, "triangle");
        break;
      case "good":
        this.blip(t, 660, 660, 0.09, 0.05, "triangle");
        this.blip(t + 0.07, 990, 990, 0.12, 0.045, "triangle");
        break;
      case "bad":
        this.blip(t, 220, 150, 0.16, 0.05, "sawtooth", 900);
        break;
      case "clap":
        this.clap(t);
        break;
      case "chime":
        for (const [i, f] of [523.25, 783.99, 1046.5].entries()) {
          this.blip(t + i * 0.09, f, f, 1.3, 0.05, "sine");
        }
        break;
      case "lift":
        for (const [i, f] of [392, 440, 523.25].entries()) {
          this.blip(t + i * 0.12, f, f, 0.35, 0.045, "triangle");
        }
        break;
    }
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = audioCtor();
    if (!Ctor) return null;
    try {
      this.ctx = new Ctor();
    } catch {
      return null;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.waitForGesture();
    return this.ctx;
  }

  /** resume on the next gesture; browsers block audio until one happens */
  private waitForGesture(): void {
    if (this.unlockBound || typeof window === "undefined") return;
    this.unlockBound = true;
    const unlock = () => {
      const ctx = this.ctx;
      if (!ctx) return;
      void ctx.resume().then(() => {
        window.removeEventListener("pointerdown", unlock, true);
        window.removeEventListener("keydown", unlock, true);
        this.unlockBound = false;
        if (this.ambientOn) this.startAmbient();
      });
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    // a click that toggled audio on is itself a gesture
    if (this.ctx?.state === "suspended") unlock();
  }

  private blip(
    t: number,
    from: number,
    to: number,
    dur: number,
    peak: number,
    type: OscillatorType,
    lowpass?: number,
  ): void {
    const ctx = this.ctx as AudioContext;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = osc;
    if (lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = lowpass;
      osc.connect(f);
      node = f;
    }
    node.connect(env).connect(this.master as GainNode);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** a hand clap is a few noise bursts a few ms apart through a bandpass */
  private clap(t: number): void {
    const ctx = this.ctx as AudioContext;
    const buf = this.noiseBuffer();
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1150;
    band.Q.value = 0.9;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    for (const offset of [0, 0.011, 0.022]) {
      env.gain.setValueAtTime(0.32, t + offset);
      env.gain.exponentialRampToValueAtTime(0.03, t + offset + 0.009);
    }
    env.gain.setValueAtTime(0.18, t + 0.033);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(band).connect(env).connect(this.master as GainNode);
    src.start(t, Math.random() * 1.5, 0.25);
  }

  /** two seconds of pink-ish noise, built once and reused */
  private noiseBuffer(): AudioBuffer {
    if (this.noise) return this.noise;
    const ctx = this.ctx as AudioContext;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Paul Kellet's economy pink filter over white noise
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
    }
    this.noise = buf;
    return buf;
  }

  private startAmbient(): void {
    if (this.ambientVoice || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(0.85, t + 4);
    bus.connect(this.master);

    const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];
    const osc = (type: OscillatorType, freq: number, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      sources.push(o);
      return o;
    };

    // binaural pair: 110 Hz left, 116 Hz right
    const merger = ctx.createChannelMerger(2);
    const left = ctx.createGain();
    const right = ctx.createGain();
    left.gain.value = 0.09;
    right.gain.value = 0.09;
    osc("sine", 110).connect(left).connect(merger, 0, 0);
    osc("sine", 110 + BINAURAL_OFFSET_HZ).connect(right).connect(merger, 0, 1);
    merger.connect(bus);

    // soft pad (A, E, A, E) through a lowpass that slowly opens and closes
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 420;
    padFilter.Q.value = 0.6;
    const pad = ctx.createGain();
    pad.gain.value = 0.05;
    for (const [f, d] of [
      [55, 0],
      [82.41, 4],
      [110, -5],
      [164.81, 3],
    ] as const) {
      osc("triangle", f, d).connect(pad);
    }
    pad.connect(padFilter).connect(bus);
    const filterLfo = osc("sine", AMBIENT_SWELL_HZ / 2);
    const filterDepth = ctx.createGain();
    filterDepth.gain.value = 260;
    filterLfo.connect(filterDepth).connect(padFilter.frequency);

    // noise bed that swells in and out like slow breath
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer();
    noise.loop = true;
    sources.push(noise);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 520;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(noiseFilter).connect(noiseGain).connect(bus);
    const swell = osc("sine", AMBIENT_SWELL_HZ);
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.04;
    swell.connect(swellDepth).connect(noiseGain.gain);

    for (const s of sources) s.start(t);

    let stopped = false;
    this.ambientVoice = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        bus.gain.cancelScheduledValues(now);
        bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), now);
        bus.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        for (const s of sources) s.stop(now + 1.6);
        sources[0]?.addEventListener("ended", () => bus.disconnect());
      },
    };
  }
}

export const sound = new SoundEngine();

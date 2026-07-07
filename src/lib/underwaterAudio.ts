/**
 * underwaterAudio — fully procedural ambient soundscape (no audio assets).
 *
 * Graph:
 *   brown noise (looped buffer) ─┬─ lowpass 160 Hz ──────────── rumbleGain ─┐
 *                                └─ bandpass 450 Hz ─ swellGain (LFO 0.07Hz)┤
 *   whale-call osc (scheduled) ─── feedback delay ──────────────────────────┼─ master → out
 *                                                                           ┘
 * The low rumble is the constant pressure of the water column; the swell
 * layer breathes slowly like distant surge; sparse synthesized whale calls
 * (pitch-glide triangle through a feedback delay) add life every 25–50 s.
 *
 * Browser autoplay policy: the AudioContext is created lazily inside a user
 * gesture (the Dive button click) via ensureStarted(). If underwater mode is
 * instead entered by scrolling (no gesture), the context starts suspended —
 * callers should invoke resumeIfSuspended() from any later pointer event.
 *
 * Page-lifetime singleton — no disposal needed.
 */

const MASTER_LEVEL = 0.16; // overall loudness ceiling — ambience, not music

class UnderwaterAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private level = 0;        // 0–1 target set by depth/mode
  private muted = false;

  /** Create and start the graph. Call from within a user gesture. */
  ensureStarted(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }

    const ctx = new AudioContext();
    this.ctx = ctx;

    // ── Master ──────────────────────────────────────────────────────────
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // ── Brown noise source (4 s loop) ───────────────────────────────────
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // ── Layer 1: deep pressure rumble ───────────────────────────────────
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 160;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.7;
    noise.connect(lowpass).connect(rumbleGain).connect(master);

    // ── Layer 2: slow surge swells ──────────────────────────────────────
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 450;
    bandpass.Q.value = 0.8;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.12;
    // LFO breathes the swell layer between ~0.04 and 0.20
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.08;
    lfo.connect(lfoDepth).connect(swellGain.gain);
    noise.connect(bandpass).connect(swellGain).connect(master);

    noise.start();
    lfo.start();

    this.applyGain();
    this.scheduleWhaleCall();
  }

  /** Resume a context that was created outside a gesture and suspended. */
  resumeIfSuspended(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** 0–1 ambience level (0 above water, scales with depth below). */
  setLevel(level: number): void {
    this.level = Math.min(1, Math.max(0, level));
    this.applyGain();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGain();
  }

  private applyGain(): void {
    if (!this.ctx || !this.master) return;
    const target = this.muted ? 0 : this.level * MASTER_LEVEL;
    // ~1.5 s ease — matches the visual fade pace of the underwater effects
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.5);
  }

  /** Sparse synthesized whale call: pitch-glide triangle + feedback delay. */
  private scheduleWhaleCall(): void {
    const delayMs = 25_000 + Math.random() * 25_000;
    setTimeout(() => {
      const ctx = this.ctx;
      // Only sing when audible — skip silently at the surface or when muted
      if (ctx && this.master && !this.muted && this.level > 0.05) {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(330, t + 1.6);
        osc.frequency.linearRampToValueAtTime(220, t + 3.8);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.35, t + 1.2);
        env.gain.linearRampToValueAtTime(0, t + 4.5);

        // Feedback delay smears the call into the distance
        const delay = ctx.createDelay(1.0);
        delay.delayTime.value = 0.42;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.35;
        delay.connect(feedback).connect(delay);

        osc.connect(env);
        env.connect(delay);
        env.connect(this.master);
        delay.connect(this.master);

        osc.start(t);
        osc.stop(t + 5);
        // Let the delay tail ring out, then release the nodes
        setTimeout(() => {
          osc.disconnect();
          env.disconnect();
          delay.disconnect();
          feedback.disconnect();
        }, 9000);
      }
      this.scheduleWhaleCall();
    }, delayMs);
  }
}

export const underwaterAudio = new UnderwaterAudioEngine();

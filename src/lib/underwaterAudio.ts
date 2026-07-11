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

  /**
   * Sparse synthesized whale call.
   *
   * A bare pitch glide reads as a siren, not an animal, so the moan is
   * built from the cues that make a call sound vocal:
   *   - low fundamental (90–140 Hz) with three slightly inharmonic partials
   *   - a moan contour: brief upward scoop, then a long falling tail —
   *     never the symmetric up-down sweep of an alarm
   *   - slow vibrato (~4–6 Hz) shared by all partials
   *   - a 500 Hz low-pass so the timbre is muffled by the water column
   *   - the feedback delay smears it into the distance
   * Fundamental, duration, and vibrato rate are randomized per call so no
   * two moans are identical.
   */
  private scheduleWhaleCall(): void {
    const delayMs = 25_000 + Math.random() * 25_000;
    setTimeout(() => {
      const ctx = this.ctx;
      // Only sing when audible — skip silently at the surface or when muted
      if (ctx && this.master && !this.muted && this.level > 0.05) {
        const t = ctx.currentTime;
        const f0 = 90 + Math.random() * 50;   // fundamental, Hz
        const dur = 3.5 + Math.random() * 2.5; // seconds

        // Pitch contour sampled into a curve so every partial glides
        // together: scoop up to f0 over the first ~18%, then fall to
        // ~0.62·f0 with an accelerating (concave) descent
        const N = 64;
        const contour = new Float32Array(N);
        for (let i = 0; i < N; i++) {
          const u = i / (N - 1);
          contour[i] =
            u < 0.18
              ? f0 * (0.85 + 0.15 * Math.sin((u / 0.18) * Math.PI * 0.5))
              : f0 * (1.0 - 0.38 * Math.pow((u - 0.18) / 0.82, 1.4));
        }

        // Envelope: slow swell, gentle sustain decay, fade to silence
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.3, t + dur * 0.25);
        env.gain.linearRampToValueAtTime(0.2, t + dur * 0.7);
        env.gain.linearRampToValueAtTime(0, t + dur);

        // Muffled timbre — the water column eats everything bright
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 500;
        lowpass.connect(env);

        // Shared vibrato: an audio-rate input on each frequency param sums
        // with its value curve, warbling all partials in unison
        const vibrato = ctx.createOscillator();
        vibrato.frequency.value = 4 + Math.random() * 2;
        const vibDepth = ctx.createGain();
        vibDepth.gain.value = f0 * 0.012;
        vibrato.connect(vibDepth);

        // Three partials; slight inharmonicity keeps it vocal, not synth
        const partials = [
          { ratio: 1.0, gain: 1.0 },
          { ratio: 2.003, gain: 0.4 },
          { ratio: 3.01, gain: 0.15 },
        ];
        const nodes: AudioNode[] = [lowpass, env, vibrato, vibDepth];
        for (const p of partials) {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          const curve = new Float32Array(N);
          for (let i = 0; i < N; i++) curve[i] = contour[i] * p.ratio;
          osc.frequency.setValueCurveAtTime(curve, t, dur);
          vibDepth.connect(osc.frequency);
          const g = ctx.createGain();
          g.gain.value = p.gain;
          osc.connect(g).connect(lowpass);
          osc.start(t);
          osc.stop(t + dur + 0.1);
          nodes.push(osc, g);
        }
        vibrato.start(t);
        vibrato.stop(t + dur + 0.1);

        // Feedback delay smears the call into the distance
        const delay = ctx.createDelay(1.0);
        delay.delayTime.value = 0.42;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.3;
        delay.connect(feedback).connect(delay);
        env.connect(delay);
        env.connect(this.master);
        delay.connect(this.master);
        nodes.push(delay, feedback);

        // Let the delay tail ring out, then release the nodes
        setTimeout(() => {
          for (const node of nodes) node.disconnect();
        }, (dur + 5) * 1000);
      }
      this.scheduleWhaleCall();
    }, delayMs);
  }
}

export const underwaterAudio = new UnderwaterAudioEngine();

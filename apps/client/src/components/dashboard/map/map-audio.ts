/**
 * Audio UI mockup — Web Audio sintetizzato (niente asset esterni).
 * Hover: fruscio/vento. Click: rintocco tipo campana.
 */
let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Chiama al primo gesto utente (click mappa). */
export async function unlockMapAudio(): Promise<void> {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      /* ignore */
    }
  }
  unlocked = c.state === "running";
}

export function playRegionHover(muted: boolean): void {
  if (muted || !unlocked) return;
  const c = getCtx();
  if (!c || c.state !== "running") return;

  const now = c.currentTime;
  const bufferSize = 2048;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.6;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(now);
  src.stop(now + 0.3);
}

export function playRegionSelect(muted: boolean): void {
  if (muted || !unlocked) return;
  const c = getCtx();
  if (!c || c.state !== "running") return;

  const now = c.currentTime;
  const master = c.createGain();
  master.gain.value = 0.12;
  master.connect(c.destination);

  // Rintocco basso (bonshō mock)
  const freqs = [180, 270, 405];
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator();
    osc.type = i === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35 / (i + 1), now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4 + i * 0.15);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + 1.6 + i * 0.15);
  });
}

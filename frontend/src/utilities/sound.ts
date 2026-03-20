let audioCtx: AudioContext | null = null;

function playNote(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "square";
  // Slight pitch bend up for trumpet attack
  osc.frequency.setValueAtTime(freq * 0.9, start);
  osc.frequency.linearRampToValueAtTime(freq, start + 0.02);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.setValueAtTime(volume, start + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
}

export function playPingSound() {
  if (!audioCtx) audioCtx = new AudioContext();
  const t = audioCtx.currentTime;
  // 8-bit trumpet fanfare: G4 E5 G4 E5 (E5 held double)
  const n = 0.2; // base note duration
  playNote(audioCtx, 392, t, n, 0.1); // G4
  playNote(audioCtx, 659, t + n, n, 0.1); // E5
  playNote(audioCtx, 392, t + n * 2 + 0.1, n, 0.1); // G4 (after 0.05s break)
  playNote(audioCtx, 659, t + n * 3 + 0.1, n * 3, 0.15); // E5 (quadruple)
}

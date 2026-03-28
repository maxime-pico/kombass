const STORAGE_KEY = "kombass_volume";
const MUTE_KEY = "kombass_muted";

let volume = parseInt(localStorage.getItem(STORAGE_KEY) ?? "5", 10);
let muted = localStorage.getItem(MUTE_KEY) === "true";

export function getVolume(): number {
  return volume;
}

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(10, v));
  localStorage.setItem(STORAGE_KEY, String(volume));
  if (volume === 0) {
    muted = true;
    localStorage.setItem(MUTE_KEY, "true");
  } else if (muted && volume > 0) {
    muted = false;
    localStorage.setItem(MUTE_KEY, "false");
  }
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): void {
  if (muted) {
    muted = false;
    if (volume === 0) volume = 5;
    localStorage.setItem(STORAGE_KEY, String(volume));
  } else {
    muted = true;
  }
  localStorage.setItem(MUTE_KEY, String(muted));
}

export function getGain(): number {
  if (muted) return 0;
  return volume / 10;
}

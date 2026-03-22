const cache = new Map<string, string>();

const ANIMATED_SPRITES = [
  "/sprites/light-p1-animated.svg",
  "/sprites/light-p2-animated.svg",
  "/sprites/medium-p1-animated.svg",
  "/sprites/medium-p2-animated.svg",
  "/sprites/heavy-p1-animated.svg",
  "/sprites/heavy-p2-animated.svg",
];

export function preloadAnimatedSprites(): void {
  ANIMATED_SPRITES.forEach((url) => {
    fetch(url)
      .then((r) => r.text())
      .then((text) => cache.set(url, text));
  });
}

export function getCachedSprite(url: string): string | undefined {
  return cache.get(url);
}

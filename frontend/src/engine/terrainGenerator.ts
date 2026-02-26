export type TerrainSquare = { x: number; y: number };

function gaussianRandom(mean: number, sigma: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma + mean;
}

function manhattanDist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function generateTerrain(
  boardWidth: number,
  boardLength: number,
  flags: Array<{ x: number; y: number }>,
  placementZone: number,
  percentage: number = 15
): TerrainSquare[] {
  if (percentage <= 0) return [];
  const total = boardWidth * boardLength;
  const target = Math.floor((percentage / 100) * total);

  // Build exclusion set: flag zones (Manhattan ≤ 3)
  const exclusion = new Set<string>();
  for (const flag of flags) {
    for (let x = 0; x < boardWidth; x++) {
      for (let y = 0; y < boardLength; y++) {
        if (manhattanDist(x, y, flag.x, flag.y) <= 3) {
          exclusion.add(`${x},${y}`);
        }
      }
    }
  }

  // Flag-adjacent set: Manhattan ≤ 4 from any flag (i.e., dist 1 from flag zone)
  const flagAdjacent = new Set<string>();
  for (const flag of flags) {
    for (let x = 0; x < boardWidth; x++) {
      for (let y = 0; y < boardLength; y++) {
        if (manhattanDist(x, y, flag.x, flag.y) <= 4) {
          flagAdjacent.add(`${x},${y}`);
        }
      }
    }
  }

  const blocked = new Set<string>();
  let leftZoneCount = 0;
  let rightZoneCount = 0;
  const MAX_RETRIES = 200;

  for (let retry = 0; retry < MAX_RETRIES && blocked.size < target; retry++) {
    // Pick seed with Gaussian x bias toward center
    const rawX = gaussianRandom(boardWidth / 2, boardWidth / 6);
    const seedX = Math.max(0, Math.min(boardWidth - 1, Math.round(rawX)));
    const seedY = Math.floor(Math.random() * boardLength);
    const seedKey = `${seedX},${seedY}`;

    if (exclusion.has(seedKey) || blocked.has(seedKey)) continue;
    // Ensure seed isn't adjacent to existing blocked squares (prevent merging)
    const seedAdjToBlocked = [
      `${seedX - 1},${seedY}`, `${seedX + 1},${seedY}`,
      `${seedX},${seedY - 1}`, `${seedX},${seedY + 1}`,
    ].some((k) => blocked.has(k));
    if (seedAdjToBlocked) continue;

    // Grow zone via random BFS from seed, max 10 squares
    const zone: TerrainSquare[] = [{ x: seedX, y: seedY }];
    const zoneSet = new Set<string>([seedKey]);
    const frontier = [{ x: seedX, y: seedY }];

    const maxZoneSize = Math.min(10, target - blocked.size);
    if (maxZoneSize <= 0) break;
    while (zone.length < maxZoneSize && frontier.length > 0) {
      const idx = Math.floor(Math.random() * frontier.length);
      const curr = frontier[idx];
      frontier.splice(idx, 1);

      const neighbors = [
        { x: curr.x - 1, y: curr.y },
        { x: curr.x + 1, y: curr.y },
        { x: curr.x, y: curr.y - 1 },
        { x: curr.x, y: curr.y + 1 },
      ];

      for (const n of neighbors) {
        if (zone.length >= 10) break;
        const key = `${n.x},${n.y}`;
        // Check adjacency to existing blocked squares (prevent zone merging)
        const adjToBlocked = [
          `${n.x - 1},${n.y}`, `${n.x + 1},${n.y}`,
          `${n.x},${n.y - 1}`, `${n.x},${n.y + 1}`,
        ].some((k) => blocked.has(k));
        if (
          n.x >= 0 && n.x < boardWidth &&
          n.y >= 0 && n.y < boardLength &&
          !exclusion.has(key) &&
          !blocked.has(key) &&
          !zoneSet.has(key) &&
          !adjToBlocked
        ) {
          zone.push(n);
          zoneSet.add(key);
          frontier.push(n);
        }
      }
    }

    // Validate: max 1 square adjacent to flag zone
    let flagAdjacentCount = 0;
    for (const sq of zone) {
      if (flagAdjacent.has(`${sq.x},${sq.y}`)) {
        flagAdjacentCount++;
        if (flagAdjacentCount > 1) break;
      }
    }
    if (flagAdjacentCount > 1) continue;

    // Check zones-per-side
    let touchesLeft = false;
    let touchesRight = false;
    for (const sq of zone) {
      if (sq.x < placementZone) touchesLeft = true;
      if (sq.x > boardWidth - placementZone - 1) touchesRight = true;
    }

    if (touchesLeft && leftZoneCount >= 1) continue;
    if (touchesRight && rightZoneCount >= 1) continue;

    // Valid zone — add it
    if (touchesLeft) leftZoneCount++;
    if (touchesRight) rightZoneCount++;
    for (const sq of zone) {
      blocked.add(`${sq.x},${sq.y}`);
    }
  }

  return Array.from(blocked).map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  });
}

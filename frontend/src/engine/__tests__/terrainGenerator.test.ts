import { generateTerrain, TerrainSquare } from "../terrainGenerator";

describe("generateTerrain", () => {
  const flags = [
    { x: 0, y: 10 },
    { x: 21, y: 10 },
  ];
  const boardWidth = 22;
  const boardLength = 21;
  const placementZone = 5;

  it("generates terrain at roughly the specified percentage", () => {
    const total = boardWidth * boardLength;
    // Test with 15%
    const terrain15 = generateTerrain(boardWidth, boardLength, flags, placementZone, 15);
    const target15 = Math.floor(0.15 * total);
    expect(terrain15.length).toBeGreaterThanOrEqual(Math.floor(target15 * 0.5));
    expect(terrain15.length).toBeLessThanOrEqual(target15 + 10);
    // Test with 0% returns empty
    expect(generateTerrain(boardWidth, boardLength, flags, placementZone, 0)).toHaveLength(0);
  });

  it("has no zone exceeding 10 contiguous squares", () => {
    const terrain = generateTerrain(boardWidth, boardLength, flags, placementZone);
    const terrainSet = new Set(terrain.map((t) => `${t.x},${t.y}`));

    // BFS to find connected components
    const visited = new Set<string>();
    for (const t of terrain) {
      const key = `${t.x},${t.y}`;
      if (visited.has(key)) continue;

      const queue = [key];
      visited.add(key);
      let size = 0;
      while (queue.length > 0) {
        const curr = queue.shift()!;
        size++;
        const [cx, cy] = curr.split(",").map(Number);
        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
          const nk = `${nx},${ny}`;
          if (terrainSet.has(nk) && !visited.has(nk)) {
            visited.add(nk);
            queue.push(nk);
          }
        }
      }
      expect(size).toBeLessThanOrEqual(10);
    }
  });

  it("places no terrain inside flag zones (Manhattan ≤ 3)", () => {
    for (let i = 0; i < 5; i++) {
      const terrain = generateTerrain(boardWidth, boardLength, flags, placementZone);
      for (const t of terrain) {
        for (const flag of flags) {
          expect(Math.abs(t.x - flag.x) + Math.abs(t.y - flag.y)).toBeGreaterThan(3);
        }
      }
    }
  });

  it("allows max 1 zone per side (placement zone columns)", () => {
    for (let i = 0; i < 10; i++) {
      const terrain = generateTerrain(boardWidth, boardLength, flags, placementZone);
      const terrainSet = new Set(terrain.map((t) => `${t.x},${t.y}`));

      // Find connected components and check side counts
      const visited = new Set<string>();
      let leftZones = 0;
      let rightZones = 0;
      for (const t of terrain) {
        const key = `${t.x},${t.y}`;
        if (visited.has(key)) continue;

        const queue = [key];
        visited.add(key);
        let touchesLeft = false;
        let touchesRight = false;
        while (queue.length > 0) {
          const curr = queue.shift()!;
          const [cx, cy] = curr.split(",").map(Number);
          if (cx < placementZone) touchesLeft = true;
          if (cx > boardWidth - placementZone - 1) touchesRight = true;
          for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
            const nk = `${nx},${ny}`;
            if (terrainSet.has(nk) && !visited.has(nk)) {
              visited.add(nk);
              queue.push(nk);
            }
          }
        }
        if (touchesLeft) leftZones++;
        if (touchesRight) rightZones++;
      }
      expect(leftZones).toBeLessThanOrEqual(1);
      expect(rightZones).toBeLessThanOrEqual(1);
    }
  });

  it("allows max 1 square per zone adjacent to flag zone", () => {
    for (let i = 0; i < 5; i++) {
      const terrain = generateTerrain(boardWidth, boardLength, flags, placementZone);
      const terrainSet = new Set(terrain.map((t) => `${t.x},${t.y}`));

      const visited = new Set<string>();
      for (const t of terrain) {
        const key = `${t.x},${t.y}`;
        if (visited.has(key)) continue;

        const queue = [key];
        visited.add(key);
        const component: Array<{ x: number; y: number }> = [];
        while (queue.length > 0) {
          const curr = queue.shift()!;
          const [cx, cy] = curr.split(",").map(Number);
          component.push({ x: cx, y: cy });
          for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]]) {
            const nk = `${nx},${ny}`;
            if (terrainSet.has(nk) && !visited.has(nk)) {
              visited.add(nk);
              queue.push(nk);
            }
          }
        }

        let adjCount = 0;
        for (const sq of component) {
          for (const flag of flags) {
            if (Math.abs(sq.x - flag.x) + Math.abs(sq.y - flag.y) <= 4) {
              adjCount++;
              break;
            }
          }
        }
        expect(adjCount).toBeLessThanOrEqual(1);
      }
    }
  });

  it("returns empty array gracefully for tiny boards", () => {
    const terrain = generateTerrain(3, 3, [{ x: 1, y: 1 }], 1);
    // Should not crash; may return empty or very few squares
    expect(Array.isArray(terrain)).toBe(true);
  });
});

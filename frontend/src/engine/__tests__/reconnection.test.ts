import { loadScenario } from "../scenarioLoader";
import { scenarios } from "../scenarios";

describe("reconnection state restoration", () => {
  it("should include terrain in loaded scenario when scenario has terrain", () => {
    const terrainScenario = scenarios.find((s) => s.name === "terrain_reconnect");
    expect(terrainScenario).toBeDefined();

    const loaded = loadScenario(terrainScenario!);
    expect(loaded.terrain).toBeDefined();
    expect(loaded.terrain).toEqual([
      { x: 5, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 7 },
    ]);
  });

  it("should default terrain to empty array when scenario has no terrain", () => {
    const basicScenario = scenarios.find((s) => s.name === "basic_melee");
    expect(basicScenario).toBeDefined();

    const loaded = loadScenario(basicScenario!);
    expect(loaded.terrain).toEqual([]);
  });
});

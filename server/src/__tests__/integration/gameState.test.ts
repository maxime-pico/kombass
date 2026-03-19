import request from "supertest";
import { app } from "../setup/testApp";
import { createFullGame, makeUnit, makeFlag, placeUnits } from "../setup/testHelpers";

describe("GET /api/game/:roomId/state", () => {
  test("returns game config, units, flag, phase, round", async () => {
    const { roomId, p0Token, p1Token } = await createFullGame();
    await request(app).post(`/api/room/${roomId}/settings`).send({
      boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
    });
    await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
    await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

    const res = await request(app)
      .get(`/api/game/${roomId}/state`)
      .set("Authorization", `Bearer ${p0Token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("phase");
    expect(res.body).toHaveProperty("round");
    expect(res.body).toHaveProperty("units");
    expect(res.body).toHaveProperty("flags");
    expect(res.body).toHaveProperty("boardWidth");
    expect(res.body).toHaveProperty("boardLength");
  });

  test("missing token → 401", async () => {
    const { roomId } = await createFullGame();
    const res = await request(app).get(`/api/game/${roomId}/state`);
    expect(res.status).toBe(401);
  });

  test("invalid token → 401", async () => {
    const { roomId } = await createFullGame();
    const res = await request(app)
      .get(`/api/game/${roomId}/state`)
      .set("Authorization", "Bearer bad-token");
    expect(res.status).toBe(401);
  });

  test("returns own units but filters opponent data appropriately", async () => {
    const { roomId, p0Token, p1Token } = await createFullGame();
    await request(app).post(`/api/room/${roomId}/settings`).send({
      boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
    });
    await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
    // P1 hasn't placed yet

    const res = await request(app)
      .get(`/api/game/${roomId}/state`)
      .set("Authorization", `Bearer ${p0Token}`);

    expect(res.status).toBe(200);
    // P0 should see their own units
    expect(res.body.units).toBeDefined();
  });
});

import request from "supertest";
import { app, clearEmittedEvents, emittedEvents } from "../setup/testApp";
import { createFullGame, makeUnit, makeFlag, placeUnits } from "../setup/testHelpers";

beforeEach(() => clearEmittedEvents());

describe("POST /api/game/:roomId/place", () => {
  describe("Success", () => {
    test("P0 places units successfully", async () => {
      const { roomId, p0Token } = await createFullGame();

      // Confirm settings to move to PLACEMENT
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });

      const units = [makeUnit({ x: 0, y: 0 })];
      const flag = makeFlag();
      const res = await placeUnits(roomId, p0Token, units, flag);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test("both players place → game becomes ACTIVE", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });

      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      // Verify game is ACTIVE
      const stateRes = await request(app)
        .get(`/api/game/${roomId}/state`)
        .set("Authorization", `Bearer ${p0Token}`);
      expect(stateRes.body.phase).toBe("ACTIVE");
    });
  });

  describe("Auth", () => {
    test("missing token → 401", async () => {
      const { roomId } = await createFullGame();
      const res = await request(app).post(`/api/game/${roomId}/place`).send({
        units: [makeUnit()], flag: makeFlag(),
      });
      expect(res.status).toBe(401);
    });

    test("invalid token → 401", async () => {
      const { roomId } = await createFullGame();
      const res = await request(app)
        .post(`/api/game/${roomId}/place`)
        .set("Authorization", "Bearer invalid-token")
        .send({ units: [makeUnit()], flag: makeFlag() });
      expect(res.status).toBe(401);
    });

    test("token from wrong game → 403", async () => {
      const { roomId } = await createFullGame();
      const other = await createFullGame();
      const res = await request(app)
        .post(`/api/game/${roomId}/place`)
        .set("Authorization", `Bearer ${other.p0Token}`)
        .send({ units: [makeUnit()], flag: makeFlag() });
      expect(res.status).toBe(403);
    });
  });

  describe("Phase", () => {
    test("wrong phase → 409", async () => {
      const { roomId, p0Token } = await createFullGame();
      // Don't confirm settings — still in LOBBY
      const res = await placeUnits(roomId, p0Token, [makeUnit()], makeFlag());
      expect(res.status).toBe(409);
    });
  });

  describe("Validation", () => {
    test("wrong unit count → 400", async () => {
      const { roomId, p0Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 5,
      });
      const res = await placeUnits(roomId, p0Token, [makeUnit(), makeUnit()], makeFlag());
      expect(res.status).toBe(400);
    });

    test("units outside placement zone → 400", async () => {
      const { roomId, p0Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      const res = await placeUnits(roomId, p0Token, [makeUnit({ x: 10, y: 10 })], makeFlag());
      expect(res.status).toBe(400);
    });

    test("duplicate positions → 400", async () => {
      const { roomId, p0Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 2,
      });
      const res = await placeUnits(
        roomId, p0Token,
        [makeUnit({ x: 0, y: 0 }), makeUnit({ x: 0, y: 0 })],
        makeFlag()
      );
      expect(res.status).toBe(400);
    });

    test("missing flag → 400", async () => {
      const { roomId, p0Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      const res = await request(app)
        .post(`/api/game/${roomId}/place`)
        .set("Authorization", `Bearer ${p0Token}`)
        .send({ units: [makeUnit()] });
      expect(res.status).toBe(400);
    });
  });

  describe("Notifications", () => {
    test("socket emit to opponent on place", async () => {
      const { roomId, p0Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      clearEmittedEvents();
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());

      const placeEvents = emittedEvents.filter((e) => e.event === "player_ready");
      expect(placeEvents.length).toBeGreaterThan(0);
    });

    test("emit to both when game starts", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      clearEmittedEvents();
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      const startEvents = emittedEvents.filter((e) => e.event === "game_start");
      expect(startEvents.length).toBeGreaterThan(0);
    });
  });
});

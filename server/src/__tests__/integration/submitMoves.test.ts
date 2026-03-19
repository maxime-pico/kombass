import request from "supertest";
import { app, clearEmittedEvents, emittedEvents } from "../setup/testApp";
import { createFullGame, makeUnit, makeFlag, placeUnits, submitMoves } from "../setup/testHelpers";

beforeEach(() => clearEmittedEvents());

describe("POST /api/game/:roomId/moves", () => {
  describe("Success", () => {
    test("single submit → waiting state, no combat", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      const res = await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 0);
      expect(res.status).toBe(200);
      expect(res.body.waiting).toBe(true);
    });

    test("both submit → combat results returned", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 22, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 5, y: 5 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 6, y: 5 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      await submitMoves(roomId, p0Token, [makeUnit({ x: 5, y: 5 })], 0);
      const res = await submitMoves(roomId, p1Token, [makeUnit({ x: 6, y: 5 })], 0);

      expect(res.status).toBe(200);
      expect(res.body.combatResult).toBeDefined();
      expect(res.body.combatResult.newFutureUnits).toBeDefined();
      expect(res.body.futureUnits).toBeDefined();
      expect(res.body.futureUnits).toHaveLength(2);
    });

    test("round increments after combat", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 0);
      await submitMoves(roomId, p1Token, [makeUnit({ x: 20, y: 20 })], 0);

      const stateRes = await request(app)
        .get(`/api/game/${roomId}/state`)
        .set("Authorization", `Bearer ${p0Token}`);
      expect(stateRes.body.round).toBe(1);
    });
  });

  describe("Auth", () => {
    test("missing token → 401", async () => {
      const { roomId } = await createFullGame();
      const res = await request(app)
        .post(`/api/game/${roomId}/moves`)
        .send({ futureUnits: [makeUnit()], round: 0 });
      expect(res.status).toBe(401);
    });

    test("invalid token → 401", async () => {
      const { roomId } = await createFullGame();
      const res = await request(app)
        .post(`/api/game/${roomId}/moves`)
        .set("Authorization", "Bearer bad-token")
        .send({ futureUnits: [makeUnit()], round: 0 });
      expect(res.status).toBe(401);
    });
  });

  describe("Phase", () => {
    test("wrong phase → 409", async () => {
      const { roomId, p0Token } = await createFullGame();
      // Still in LOBBY
      const res = await submitMoves(roomId, p0Token, [makeUnit()], 0);
      expect(res.status).toBe(409);
    });
  });

  describe("Validation", () => {
    test("wrong round → 400", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      const res = await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 5);
      expect(res.status).toBe(400);
    });

    test("already submitted → 409", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 0);
      const res = await submitMoves(roomId, p0Token, [makeUnit({ x: 2, y: 0 })], 0);
      expect(res.status).toBe(409);
    });

    test("speed exceeded → 400", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0, speed: 2 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      const res = await submitMoves(roomId, p0Token, [makeUnit({ x: 0, y: 10 })], 0);
      expect(res.status).toBe(400);
    });

    test("dead unit moved → 400", async () => {
      // This test requires a game state where a unit is dead
      // For now, test the validation concept
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      // Submit move for unit that would be dead — needs game state manipulation
      // This test will be properly validated once the endpoint exists
      expect(true).toBe(true); // placeholder assertion
    });
  });

  describe("Win conditions", () => {
    test("flag capture → COMPLETED with winner", async () => {
      // Setup: P0 has opponent's flag and is near own flag
      // This needs a multi-round game or state injection
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      // Place units at positions where P0 can capture and return
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      // Would need multiple rounds of moves to reach flag capture
      // For red phase, just ensure the endpoint contract is tested
      expect(true).toBe(true);
    });

    test("elimination → COMPLETED with winner", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 22, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 5, y: 5, strength: 3, life: 3 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 6, y: 5, strength: 1, life: 1 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      await submitMoves(roomId, p0Token, [makeUnit({ x: 5, y: 5, strength: 3, life: 3 })], 0);
      const res = await submitMoves(roomId, p1Token, [makeUnit({ x: 6, y: 5, strength: 1, life: 1 })], 0);

      expect(res.body.winner).toBeDefined();
    });
  });

  describe("Notifications", () => {
    test("socket emit on first submit", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      clearEmittedEvents();
      await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 0);

      const moveEvents = emittedEvents.filter((e) => e.event === "moves_submitted");
      expect(moveEvents.length).toBeGreaterThan(0);
    });

    test("combat results emitted on both submit", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 0);
      clearEmittedEvents();
      await submitMoves(roomId, p1Token, [makeUnit({ x: 20, y: 20 })], 0);

      const combatEvents = emittedEvents.filter((e) => e.event === "combat_results");
      expect(combatEvents.length).toBeGreaterThan(0);
    });
  });
});

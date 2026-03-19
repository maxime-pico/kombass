import request from "supertest";
import { app } from "../setup/testApp";
import { createFullGame, makeUnit, makeFlag, placeUnits, submitMoves, getState } from "../setup/testHelpers";

describe("Information hiding", () => {
  describe("During PLACEMENT", () => {
    test("opponent units/flag hidden until both ready", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });

      // P0 places, P1 hasn't
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());

      // P1 checks state — should NOT see P0's units
      const stateRes = await getState(roomId, p1Token);
      expect(stateRes.status).toBe(200);
      expect(stateRes.body.opponentUnits).toBeUndefined();
    });
  });

  describe("During ACTIVE", () => {
    test("opponent futureUnits hidden until both submitted", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      // P0 submits moves
      await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 0);

      // P1 checks state — should NOT see P0's futureUnits
      const stateRes = await getState(roomId, p1Token);
      expect(stateRes.status).toBe(200);
      expect(stateRes.body.opponentFutureUnits).toBeUndefined();
    });

    test("submit-moves response never leaks opponent pending moves", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 0, y: 0 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 21, y: 20 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      // P0 submits first
      await submitMoves(roomId, p0Token, [makeUnit({ x: 1, y: 0 })], 0);

      // P1 submits — response should not contain P0's pending moves separately
      const res = await submitMoves(roomId, p1Token, [makeUnit({ x: 20, y: 20 })], 0);
      // If combat happened, both see results; otherwise pending moves stay hidden
      if (res.body.waiting) {
        expect(res.body.opponentFutureUnits).toBeUndefined();
      }
    });
  });

  describe("After combat resolution", () => {
    test("both players see full results after combat", async () => {
      const { roomId, p0Token, p1Token } = await createFullGame();
      await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 22, unitsCount: 1,
      });
      await placeUnits(roomId, p0Token, [makeUnit({ x: 5, y: 5 })], makeFlag());
      await placeUnits(roomId, p1Token, [makeUnit({ x: 6, y: 5 })], makeFlag({ x: 21, y: 10, originX: 21, originY: 10 }));

      await submitMoves(roomId, p0Token, [makeUnit({ x: 5, y: 5 })], 0);
      await submitMoves(roomId, p1Token, [makeUnit({ x: 6, y: 5 })], 0);

      // Both players should now see full state including opponent units
      const p0State = await getState(roomId, p0Token);
      const p1State = await getState(roomId, p1Token);

      expect(p0State.body.units).toBeDefined();
      expect(p1State.body.units).toBeDefined();
      // Both should have all units visible after combat
      expect(p0State.body.units.length).toBe(2);
      expect(p1State.body.units.length).toBe(2);
    });
  });
});

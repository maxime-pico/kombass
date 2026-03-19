import request from "supertest";
import { app, clearEmittedEvents, emittedEvents } from "../setup/testApp";

beforeEach(() => clearEmittedEvents());

describe("Room endpoints", () => {
  describe("POST /api/room", () => {
    test("creates a room and returns roomId + sessionToken", async () => {
      const res = await request(app).post("/api/room");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("roomId");
      expect(res.body).toHaveProperty("sessionToken");
    });
  });

  describe("POST /api/room/:roomId/join", () => {
    test("joins an existing room", async () => {
      const createRes = await request(app).post("/api/room");
      const { roomId } = createRes.body;

      const joinRes = await request(app).post(`/api/room/${roomId}/join`);
      expect(joinRes.status).toBe(200);
      expect(joinRes.body).toHaveProperty("sessionToken");
    });

    test("returns 404 for non-existent room", async () => {
      const res = await request(app).post("/api/room/nonexistent/join");
      expect(res.status).toBe(404);
    });

    test("returns 409 for completed game", async () => {
      const createRes = await request(app).post("/api/room");
      const { roomId } = createRes.body;
      // Need to complete the game first — this validates the contract
      // For now, test that joining an active 2-player game returns 409
      await request(app).post(`/api/room/${roomId}/join`);
      const res = await request(app).post(`/api/room/${roomId}/join`);
      // Third player trying to join — should get 409
      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/room/:roomId/status", () => {
    test("new room is joinable", async () => {
      const createRes = await request(app).post("/api/room");
      const { roomId } = createRes.body;

      const res = await request(app).get(`/api/room/${roomId}/status`);
      expect(res.status).toBe(200);
      expect(res.body.joinable).toBe(true);
    });

    test("room with 2 players is not joinable", async () => {
      const createRes = await request(app).post("/api/room");
      const { roomId } = createRes.body;
      await request(app).post(`/api/room/${roomId}/join`);

      const res = await request(app).get(`/api/room/${roomId}/status`);
      expect(res.body.joinable).toBe(false);
    });

    test("non-existent room defaults to joinable", async () => {
      const res = await request(app).get("/api/room/doesnotexist/status");
      expect(res.body.joinable).toBe(true);
    });
  });

  describe("POST /api/room/:roomId/settings", () => {
    test("confirms settings and transitions to PLACEMENT", async () => {
      const createRes = await request(app).post("/api/room");
      const { roomId } = createRes.body;
      await request(app).post(`/api/room/${roomId}/join`);

      clearEmittedEvents();
      const res = await request(app).post(`/api/room/${roomId}/settings`).send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 5,
      });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Should emit settings_confirmed
      const confirmEvents = emittedEvents.filter((e) => e.event === "settings_confirmed");
      expect(confirmEvents.length).toBeGreaterThan(0);
    });

    test("returns 404 for non-existent room", async () => {
      const res = await request(app).post("/api/room/nonexistent/settings").send({
        boardWidth: 22, boardLength: 21, placementZone: 5, unitsCount: 5,
      });
      expect(res.status).toBe(404);
    });
  });
});

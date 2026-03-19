import { IUnit, IFlag } from "../../../../shared/types";
import request from "supertest";
import { app } from "./testApp";

export function makeUnit(overrides: Partial<IUnit> = {}): IUnit {
  return {
    x: 0,
    y: 0,
    strength: 2,
    range: 2,
    speed: 2,
    life: 2,
    hasFlag: false,
    unitType: 1,
    ...overrides,
  };
}

export function makeFlag(overrides: Partial<IFlag> = {}): IFlag {
  return {
    x: 0,
    y: 10,
    originX: 0,
    originY: 10,
    inZone: true,
    ...overrides,
  };
}

export async function createTestGame(): Promise<{ roomId: string; p0Token: string }> {
  const res = await request(app).post("/api/room").expect(200);
  return { roomId: res.body.roomId, p0Token: res.body.sessionToken };
}

export async function createFullGame(): Promise<{
  roomId: string;
  p0Token: string;
  p1Token: string;
}> {
  const { roomId, p0Token } = await createTestGame();
  const joinRes = await request(app).post(`/api/room/${roomId}/join`).expect(200);
  return { roomId, p0Token, p1Token: joinRes.body.sessionToken };
}

export async function placeUnits(
  roomId: string,
  token: string,
  units: IUnit[],
  flag: IFlag
): Promise<request.Response> {
  return request(app)
    .post(`/api/game/${roomId}/place`)
    .set("Authorization", `Bearer ${token}`)
    .send({ units, flag });
}

export async function submitMoves(
  roomId: string,
  token: string,
  futureUnits: IUnit[],
  round: number
): Promise<request.Response> {
  return request(app)
    .post(`/api/game/${roomId}/moves`)
    .set("Authorization", `Bearer ${token}`)
    .send({ futureUnits, round });
}

export async function getState(
  roomId: string,
  token: string
): Promise<request.Response> {
  return request(app)
    .get(`/api/game/${roomId}/state`)
    .set("Authorization", `Bearer ${token}`);
}

import app from "../../app";

// Mock Socket.io — store emitted events for assertion
export const emittedEvents: Array<{ room: string; event: string; data: any }> = [];

const mockIo = {
  to: (room: string) => ({
    emit: (event: string, data: any) => {
      emittedEvents.push({ room, event, data });
    },
  }),
};

app.set("io", mockIo);

export function clearEmittedEvents() {
  emittedEvents.length = 0;
}

export { app };

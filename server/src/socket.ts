import { useSocketServer } from "socket-controllers";
import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export default (httpServer: HttpServer) => {
  // CORS configuration: allow localhost in dev, restrict to FRONTEND_URL in production
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL || "https://kombass.maximepico.com"]
      : ["http://localhost:3000"];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
    },
  });

  useSocketServer(io, { controllers: [__dirname + "/api/controllers/*.js"] });

  return io;
};

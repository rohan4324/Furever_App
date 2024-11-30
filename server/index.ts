import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import MemoryStore from "memorystore";
import { setupVite, serveStatic } from "./vite";
import { configureSecurityMiddleware, logger } from "./middleware/security";
import { registerRoutes } from "./routes";
import compression from "compression";

const app = express();

// 1. Compression middleware
app.use(compression());

// 2. Body parsing middleware
app.use(express.json({ 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));

// 3. Session middleware
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict'
  }
}));

// 4. Security middleware
configureSecurityMiddleware(app);

(async () => {
  // 5. API routes
  registerRoutes(app);
  
  const server = createServer(app);
  const io = new Server(server);

  // WebSocket setup for video consultations
  io.on("connection", (socket) => {
    socket.on("join-room", ({ appointmentId, userId }) => {
      socket.join(appointmentId);
      socket.to(appointmentId).emit("user-connected", userId);
    });

    socket.on("leave-room", ({ appointmentId, userId }) => {
      socket.to(appointmentId).emit("user-disconnected", userId);
    });
  });

  // 6. Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
      ? status === 500 ? 'Internal Server Error' : err.message
      : err.message || 'Internal Server Error';

    logger.error('Error:', {
      status,
      message: err.message,
      stack: err.stack,
      path: _req.path,
      method: _req.method
    });

    res.status(status).json({ 
      status: status < 500 ? 'error' : 'fail',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // 7. Static/Vite handling
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || '5000', 10);
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
  });
})();
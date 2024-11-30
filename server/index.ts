import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { configureSecurityMiddleware, logger } from "./middleware/security";
import path from "path";

// Extend Express Request type to include session
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Video consultation room type
interface VideoRoom {
  appointmentId: string;
  participants: string[];
}

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();

// Configure security middleware
configureSecurityMiddleware(app);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Configure session middleware
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // Cleanup expired sessions every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  name: 'sessionId', // Change default cookie name
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  registerRoutes(app);
  const server = createServer(app);
  const io = new Server(server);
  
  // Store active video consultation rooms
  const videoRooms = new Map<string, VideoRoom>();

  // Handle WebSocket connections for video consultations
  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("join-room", ({ appointmentId, userId }) => {
      let room = videoRooms.get(appointmentId);
      if (!room) {
        room = { appointmentId, participants: [] };
        videoRooms.set(appointmentId, room);
      }
      
      room.participants.push(userId);
      socket.join(appointmentId);
      
      // Notify others in the room
      socket.to(appointmentId).emit("user-connected", userId);
    });

    socket.on("video-signal", ({ appointmentId, signal, userId }) => {
      socket.to(appointmentId).emit("video-signal", { signal, userId });
    });

    socket.on("leave-room", ({ appointmentId, userId }) => {
      const room = videoRooms.get(appointmentId);
      if (room) {
        room.participants = room.participants.filter(id => id !== userId);
        if (room.participants.length === 0) {
          videoRooms.delete(appointmentId);
        }
      }
      socket.to(appointmentId).emit("user-disconnected", userId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Sanitize error messages in production
    const message = process.env.NODE_ENV === 'production'
      ? status === 500 ? 'Internal Server Error' : err.message
      : err.message || 'Internal Server Error';

    // Log the full error in production
    if (process.env.NODE_ENV === 'production') {
      logger.error('Error:', {
        status,
        message: err.message,
        stack: err.stack,
        path: _req.path,
        method: _req.method
      });
    }

    res.status(status).json({ 
      status: status < 500 ? 'error' : 'fail',
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Promise Rejection:', reason);
    // Don't exit the process in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();

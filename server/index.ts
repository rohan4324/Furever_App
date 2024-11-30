import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import MemoryStore from "memorystore";
import { setupVite, serveStatic } from "./vite";
import { configureSecurityMiddleware, logger } from "./middleware/security";
import { registerRoutes } from "./routes";
import compression from "compression";

interface VideoRoom {
  appointmentId: string;
  participants: string[];
}

function log(message: string) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const formattedTime = `${hours}:${minutes}:${seconds}`;
  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();

// 1. Compression middleware (should be first)
app.use(compression());

// 2. Security middleware
configureSecurityMiddleware(app);

// 3. Body parsing middleware with size limits and validation
app.use(express.json({ 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));

// Request size monitoring middleware
const requestSizeMonitor = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 500000) { // Log requests larger than 500KB
    logger.warn({
      message: 'Large request detected',
      size: contentLength,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }
  next();
};

app.use(requestSizeMonitor);

// 4. Session middleware
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

// Request logging middleware
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
  // 5. API routes
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

  // 6. Global error handler
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

  // 7. Setup Vite/Static file serving (based on environment)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
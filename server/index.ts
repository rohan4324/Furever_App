import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import cors from "cors";
import csrf from "csrf";
import compression from "compression";
import rateLimit from "express-rate-limit";
import winston from "winston";

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

// Initialize Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openweathermap.org"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-domain.com' 
    : 'http://localhost:5000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Enable gzip compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
const MemoryStoreSession = MemoryStore(session);
// CSRF Protection
const tokens = new csrf();
const secret = tokens.secretSync();

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
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
}));

// CSRF middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for non-mutating methods
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const token = tokens.create(secret);
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });

  const userToken = req.headers['x-xsrf-token'] as string;
  if (!userToken || !tokens.verify(secret, userToken)) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
});

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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

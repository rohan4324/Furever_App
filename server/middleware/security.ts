import { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import winston from "winston";

// Configure Winston logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
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

// Rate limiting configuration
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later"
});

// CORS configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN || 'https://yourdomain.com'
    : ['http://localhost:5000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
  preflightContinue: false,
  exposedHeaders: ['Content-Length', 'Content-Type']
};

// Cache control middleware
export const cacheControl = (req: Request, res: Response, next: NextFunction) => {
  // Static assets
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|ttf|eot|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  } 
  // API responses
  else if (req.url.startsWith('/api')) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
};

// Production rate limiting configuration
export const productionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (!req.url) return false;
    // Skip rate limiting for static assets and health checks
    const isStaticAsset = /\.(css|js|jpg|jpeg|png|gif|ico|woff|woff2|ttf|eot|svg)$/.test(req.url);
    const isHealthCheck = req.url === '/health' || req.url === '/ping';
    return isStaticAsset || isHealthCheck;
  },
  handler: (req, res) => {
    logger.warn({
      message: 'Rate limit exceeded',
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Please try again later',
      retryAfter: Math.ceil(15 * 60) // 15 minutes in seconds
    });
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if available, otherwise use IP
    return req.headers['x-forwarded-for']?.toString() || req.ip;
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  requestWasSuccessful: (req, res) => res.statusCode < 400
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    error: {
      message: err.message,
      stack: err.stack
    },
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next(err);
};

// Configure security middleware
export const configureSecurityMiddleware = (app: any) => {
  // Apply helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.CORS_ORIGIN].filter((src): src is string => typeof src === 'string'),
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        workerSrc: ["'self'", "blob:"],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"]
      },
    },
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
    crossOriginOpenerPolicy: { policy: process.env.NODE_ENV === 'production' ? 'same-origin' : 'unsafe-none' },
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }));

  // Apply CORS
  app.use(cors(corsOptions));

  // Apply cache control
  app.use(cacheControl);

  // Apply rate limiting for production
  app.use('/api/', productionRateLimiter);

  // Apply logging middleware
  app.use(requestLogger);
  app.use(errorLogger);
};

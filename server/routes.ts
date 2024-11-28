import type { Express, Request } from "express";
import { db } from "../db";
import { users, pets, shelters, breeders, messages, adoptionApplications } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";

// Passport configuration
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export function registerRoutes(app: Express) {
  // Breeder routes
  app.get("/api/breeders", async (req, res) => {
    try {
      const results = await db
        .select({
          id: breeders.id,
          userId: breeders.userId,
          description: breeders.description,
          address: breeders.address,
          phone: breeders.phone,
          website: breeders.website,
          specializations: breeders.specializations,
          verificationStatus: breeders.verificationStatus,
          user: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        })
        .from(breeders)
        .leftJoin(users, eq(breeders.userId, users.id));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch breeders" });
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials are required");
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.NODE_ENV === 'production'
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`
      : 'http://localhost:5000/api/auth/google/callback'
  }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
      let user = await db.query.users.findFirst({
        where: eq(users.email, profile.emails?.[0]?.value || ""),
      });

      if (!user) {
        const [newUser] = await db.insert(users)
          .values({
            email: profile.emails?.[0]?.value || "",
            name: profile.displayName,
            password: "", // Social login users don't need passwords
            type: "adopter_buyer",
          })
          .returning();
        user = newUser;
      }

      done(null, user);
    } catch (error) {
      done(error as Error, undefined);
    }
  }));

  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = await db
        .insert(users)
        .values({
          ...req.body,
          password: hashedPassword,
        })
        .returning();
      
      req.session.userId = user[0].id;
      res.json({ user: user[0] });
    } catch (error) {
      res.status(400).json({ error: "Registration failed" });
    }
  });

  // OAuth Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      if (req.user) {
        req.session.userId = (req.user as any).id;
      }
      res.redirect("/");
    }
  );

  

  app.post("/api/auth/login", async (req, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, req.body.email),
      });

      if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Login failed" });
    }
  });

  // Pet routes
  app.get("/api/pets", async (req, res) => {
    try {
      const filterSchema = z.object({
        type: z.enum(["dog", "cat", "fish", "bird", "hamster", "rabbit", "guinea_pig", "other"]).optional().nullable(),
        breed: z.string().optional().nullable(),
        size: z.enum(["small", "medium", "large"]).optional().nullable(),
        gender: z.enum(["male", "female"]).optional().nullable(),
        city: z.string().optional().nullable(),
        ageYears: z.string().optional().nullable(),
        ageMonths: z.string().optional().nullable(),
      }).partial();

      const filters = filterSchema.parse(req.query);
      const conditions = [];

      // Basic filters
      if (filters.type != null) {
        conditions.push(eq(pets.type, filters.type));
      }
      if (filters.breed != null) {
        conditions.push(eq(pets.breed, filters.breed));
      }
      if (filters.city != null) {
        conditions.push(eq(pets.city, filters.city));
      }
      if (filters.size != null) {
        conditions.push(eq(pets.size, filters.size));
      }
      if (filters.gender != null) {
        conditions.push(eq(pets.gender, filters.gender));
      }

      // Age filters using jsonb
      if (filters.ageYears) {
        const minYears = parseInt(filters.ageYears);
        const maxYears = minYears === 6 ? 30 : minYears + 2;
        
        conditions.push(
          and(
            sql`CAST((${pets.age}->>'years')::text AS INTEGER) >= ${minYears}`,
            sql`CAST((${pets.age}->>'years')::text AS INTEGER) < ${maxYears}`
          )
        );
      }

      if (filters.ageMonths) {
        const monthRanges: Record<string, [number, number]> = {
          "0": [0, 3],
          "4": [4, 6],
          "7": [7, 9],
          "10": [10, 12]
        };
        
        const [minMonths, maxMonths] = monthRanges[filters.ageMonths];
        conditions.push(
          and(
            sql`CAST((${pets.age}->>'months')::text AS INTEGER) >= ${minMonths}`,
            sql`CAST((${pets.age}->>'months')::text AS INTEGER) < ${maxMonths}`
          )
        );
      }

      // Build and execute query
      const query = db.select().from(pets);
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error('Error in /api/pets:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid query parameters" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/pets", upload.array("images", 5), async (req: Request & { files?: Express.Multer.File[] }, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const data = JSON.parse(req.body.data);
      
      // Create image URLs
      const imageUrls = req.files.map(
        (file) => `/uploads/${file.filename}`
      );

      const pet = await db
        .insert(pets)
        .values({
          ...data,
          images: imageUrls,
          shelterId: req.session.userId,
          status: "available",
        })
        .returning();

      res.json(pet[0]);
    } catch (error) {
      // Clean up uploaded files if there's an error
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlinkSync(file.path);
        });
      }
      res.status(400).json({ error: "Failed to create pet listing" });
    }
  });

  // Shelter routes
  app.get("/api/shelters", async (req, res) => {
    try {
      const results = await db
        .select({
          id: shelters.id,
          userId: shelters.userId,
          description: shelters.description,
          address: shelters.address,
          phone: shelters.phone,
          website: shelters.website,
          verificationStatus: shelters.verificationStatus,
          user: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        })
        .from(shelters)
        .leftJoin(users, eq(shelters.userId, users.id));
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shelters" });
    }
  });

  // Messages routes
  app.post("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const message = await db
        .insert(messages)
        .values({
          fromUserId: req.session.userId,
          ...req.body,
        })
        .returning();
      res.json(message[0]);
    } catch (error) {
      res.status(400).json({ error: "Failed to send message" });
    }
  });

  // Adoption application routes
  app.post("/api/applications", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const application = await db
        .insert(adoptionApplications)
        .values({
          userId: req.session.userId,
          ...req.body,
        })
        .returning();
      res.json(application[0]);
    } catch (error) {
      res.status(400).json({ error: "Failed to submit application" });
    }
  });
}
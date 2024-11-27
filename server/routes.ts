import type { Express } from "express";
import { db } from "../db";
import { users, pets, shelters, messages, adoptionApplications } from "@db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

export function registerRoutes(app: Express) {
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
        type: z.enum(["dog", "cat", "other"]).optional(),
        breed: z.string().optional(),
        size: z.enum(["small", "medium", "large"]).optional(),
        age: z.enum(["baby", "young", "adult", "senior"]).optional(),
      });

      const filters = filterSchema.parse(req.query);
      const conditions = [];

      if (filters.type) {
        conditions.push(eq(pets.type, filters.type));
      }
      if (filters.breed) {
        conditions.push(eq(pets.breed, filters.breed));
      }
      if (filters.size) {
        conditions.push(eq(pets.size, filters.size));
      }
      if (filters.age) {
        conditions.push(eq(pets.age, filters.age));
      }

      const query = db.select().from(pets);
      
      if (conditions.length > 0) {
        conditions.forEach(condition => {
          query.where(condition);
        });
      }

      const results = await query;
      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid query parameters" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/pets", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const pet = await db
        .insert(pets)
        .values({
          ...req.body,
          shelterId: req.session.userId,
        })
        .returning();
      res.json(pet[0]);
    } catch (error) {
      res.status(400).json({ error: "Failed to create pet listing" });
    }
  });

  // Shelter routes
  app.get("/api/shelters", async (req, res) => {
    const results = await db.select().from(shelters)
      .leftJoin(users, eq(shelters.userId, users.id));
    res.json(results);
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

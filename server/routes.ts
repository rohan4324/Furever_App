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
    const filters = z.object({
      type: z.string().optional(),
      breed: z.string().optional(),
      size: z.string().optional(),
      age: z.string().optional(),
    }).parse(req.query);

    let query = db.select().from(pets);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query = query.where(eq(pets[key as keyof typeof pets], value));
      }
    });

    const results = await query;
    res.json(results);
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

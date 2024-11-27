import { pgTable, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  type: text("type", { enum: ["adopter", "shelter"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const pets = pgTable("pets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: text("type", { enum: ["dog", "cat", "other"] }).notNull(),
  breed: text("breed").notNull(),
  age: text("age", { enum: ["baby", "young", "adult", "senior"] }).notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  size: text("size", { enum: ["small", "medium", "large"] }).notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull(),
  shelterId: integer("shelter_id").references(() => users.id).notNull(),
  status: text("status", { enum: ["available", "pending", "adopted"] }).default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const shelters = pgTable("shelters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  website: text("website"),
  verificationStatus: boolean("verification_status").default(false).notNull()
});

export const messages = pgTable("messages", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const adoptionApplications = pgTable("adoption_applications", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").references(() => pets.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  questionnaire: jsonb("questionnaire").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPetSchema = createInsertSchema(pets);
export const selectPetSchema = createSelectSchema(pets);
export const insertShelterSchema = createInsertSchema(shelters);
export const selectShelterSchema = createSelectSchema(shelters);
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export const insertAdoptionApplicationSchema = createInsertSchema(adoptionApplications);
export const selectAdoptionApplicationSchema = createSelectSchema(adoptionApplications);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type Pet = z.infer<typeof selectPetSchema>;
export type Shelter = z.infer<typeof selectShelterSchema>;
export type Message = z.infer<typeof selectMessageSchema>;
export type AdoptionApplication = z.infer<typeof selectAdoptionApplicationSchema>;
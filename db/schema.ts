import { pgTable, text, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  type: text("type", { enum: ["adopter_buyer", "shelter_ngo", "breeder", "expert_consultant"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const pets = pgTable("pets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: text("type", { enum: ["dog", "cat", "fish", "bird", "hamster", "rabbit", "guinea_pig", "other"] }).notNull(),
  breed: text("breed").notNull(),
  age: jsonb("age").notNull().default({ years: 0, months: 0 }).notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  size: text("size", { enum: ["small", "medium", "large"] }).notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull(),
  city: text("city").default("Unknown"),
  shelterId: integer("shelter_id").references(() => users.id).notNull(),
  breederId: integer("breeder_id").references(() => users.id),
  isFromBreeder: boolean("is_from_breeder").default(false).notNull(),
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

export const breeders = pgTable("breeders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  website: text("website"),
  specializations: text("specializations").array().notNull().default([]),
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
export const insertBreederSchema = createInsertSchema(breeders);
export const selectBreederSchema = createSelectSchema(breeders);
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export const insertAdoptionApplicationSchema = createInsertSchema(adoptionApplications);
export const selectAdoptionApplicationSchema = createSelectSchema(adoptionApplications);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Pet = z.infer<typeof selectPetSchema>;
export type Shelter = z.infer<typeof selectShelterSchema>;
export type Breeder = z.infer<typeof selectBreederSchema>;
export type Message = z.infer<typeof selectMessageSchema>;
export type AdoptionApplication = z.infer<typeof selectAdoptionApplicationSchema>;
export const products = pgTable("products", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price").notNull(),
  category: text("category", { 
    enum: ["food", "accessories", "grooming", "training", "safety"] 
  }).notNull(),
  subCategory: text("sub_category").notNull(),
  images: text("images").array().notNull(),
  brand: text("brand").notNull(),
  stock: integer("stock").notNull(),
  rating: decimal("rating"),
  petType: text("pet_type", {
    enum: ["dog", "cat", "fish", "bird", "hamster", "rabbit", "guinea_pig", "other"]
  }).array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const cartItems = pgTable("cart_items", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Add Zod schemas for new tables
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const selectCartItemSchema = createSelectSchema(cartItems);

// Add types for new tables
export type Product = z.infer<typeof selectProductSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = z.infer<typeof selectCartItemSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertPet = z.infer<typeof insertPetSchema>;

// Health Services Tables
export const veterinarians = pgTable("veterinarians", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  specializations: text("specializations").array().notNull(),
  qualifications: text("qualifications").array().notNull(),
  clinicAddress: text("clinic_address").notNull(),
  clinicPhone: text("clinic_phone").notNull(),
  availableSlots: jsonb("available_slots").notNull(),
  rating: decimal("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const vaccinations = pgTable("vaccinations", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").references(() => pets.id).notNull(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  nextDueDate: timestamp("next_due_date"),
  veterinarianId: integer("veterinarian_id").references(() => veterinarians.id),
  notes: text("notes"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const vetAppointments = pgTable("vet_appointments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").references(() => pets.id).notNull(),
  veterinarianId: integer("veterinarian_id").references(() => veterinarians.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dateTime: timestamp("date_time").notNull(),
  type: text("type", { enum: ["checkup", "vaccination", "emergency", "grooming", "consultation"] }).notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled", "no_show"] }).default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const petInsurance = pgTable("pet_insurance", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").references(() => pets.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(),
  policyNumber: text("policy_number").notNull(),
  coverageDetails: jsonb("coverage_details").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status", { enum: ["active", "expired", "cancelled"] }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const healthRecords = pgTable("health_records", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  petId: integer("pet_id").references(() => pets.id).notNull(),
  type: text("type", { enum: ["condition", "medication", "allergy", "surgery", "test_result"] }).notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  veterinarianId: integer("veterinarian_id").references(() => veterinarians.id),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Add Zod schemas for health services tables
export const insertVeterinarianSchema = createInsertSchema(veterinarians);
export const selectVeterinarianSchema = createSelectSchema(veterinarians);
export const insertVaccinationSchema = createInsertSchema(vaccinations);
export const selectVaccinationSchema = createSelectSchema(vaccinations);
export const insertVetAppointmentSchema = createInsertSchema(vetAppointments);
export const selectVetAppointmentSchema = createSelectSchema(vetAppointments);
export const insertPetInsuranceSchema = createInsertSchema(petInsurance);
export const selectPetInsuranceSchema = createSelectSchema(petInsurance);
export const insertHealthRecordSchema = createInsertSchema(healthRecords);
export const selectHealthRecordSchema = createSelectSchema(healthRecords);

// Add types for health services tables
export type Veterinarian = z.infer<typeof selectVeterinarianSchema>;
export type InsertVeterinarian = z.infer<typeof insertVeterinarianSchema>;
export type Vaccination = z.infer<typeof selectVaccinationSchema>;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;
export type VetAppointment = z.infer<typeof selectVetAppointmentSchema>;
export type InsertVetAppointment = z.infer<typeof insertVetAppointmentSchema>;
export type PetInsurance = z.infer<typeof selectPetInsuranceSchema>;
export type InsertPetInsurance = z.infer<typeof insertPetInsuranceSchema>;
export type HealthRecord = z.infer<typeof selectHealthRecordSchema>;
export type InsertHealthRecord = z.infer<typeof insertHealthRecordSchema>;

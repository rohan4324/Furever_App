import type { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { 
  users, pets, shelters, breeders, messages, 
  adoptionApplications, products, cartItems,
  veterinarians, vaccinations, vetAppointments, 
  healthRecords 
} from "@db/schema";

// Error Types
class AppError extends Error {
  constructor(
    public statusCode: number,
    public type: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error Handler Middleware
const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      type: error.type,
      message: error.message,
      details: error.details,
    });
  }

  // Default error response
  return res.status(500).json({
    type: 'InternalServerError',
    message: 'An unexpected error occurred',
  });
};

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

import { eq, and, sql, asc, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "public/images/products");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Update image paths in migrations
const imageBaseUrl = "/images/products/";

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
  // Register error handler
  app.use(errorHandler);

  // Breeder routes
  app.get("/api/breeders", asyncHandler(async (req, res) => {
    const results = await db
      .select({
        id: breeders.id,
        userId: breeders.userId,
        description: sql<string>`${breeders.description}::text`, // Assuming sql returns a string
        address: sql<string>`${breeders.address}::text`,
        phone: sql<string>`${breeders.phone}::text`,
        website: sql<string>`${breeders.website}::text`,
        specializations: breeders.specializations,
        verificationStatus: breeders.verificationStatus,
        user: {
          id: users.id,
          name: sql<string>`${users.name}::text`,
          email: sql<string>`${users.email}::text`
        }
      })
      .from(breeders)
      .leftJoin(users, eq(breeders.userId, users.id));

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No breeders found');
    }

    res.json(results);
  }));

  // Other routes...
  // Get veterinarians list
  app.get("/api/veterinarians", asyncHandler(async (req, res) => {
    const results = await db
      .select({
        id: veterinarians.id,
        userId: veterinarians.userId,
        specializations: veterinarians.specializations,
        qualifications: veterinarians.qualifications,
        clinicAddress: sql<string>`${veterinarians.clinicAddress}::text`,
        clinicPhone: sql<string>`${veterinarians.clinicPhone}::text`,
        availableSlots: veterinarians.availableSlots,
        rating: veterinarians.rating,
        user: {
          id: users.id,
          name: sql<string>`${users.name}::text`.mapWith(String),
          email: sql<string>`${users.email}::text`.mapWith(String)
        }
      })
      .from(veterinarians)
      .leftJoin(users, eq(veterinarians.userId, users.id));

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No veterinarians found');
    }

    res.json(results);
  }));
  // Products routes with proper type handling
  app.get("/api/products", asyncHandler(async (req, res) => {
    const { category, sortBy, petType } = req.query;

    let query = db
      .select()
      .from(products);
    
    if (category) {
      query = query.where(eq(products.category, category as string));
    }
    
    if (petType && petType !== "all") {
      query = query.where(sql`${products.petType}::text[] @> ARRAY[${petType}]::text[]`);
    }

    // Apply sorting with proper type handling
    if (sortBy) {
      if (sortBy === "price_asc") {
        query = query.orderBy(asc(products.price));
      } else if (sortBy === "price_desc") {
        query = query.orderBy(desc(products.price));
      } else if (sortBy === "rating") {
        query = query.orderBy(desc(products.rating));
      }
    }

    const results = await query;

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No products found');
    }

    res.json(results);
  }));

  app.post("/api/products", asyncHandler(async (req, res) => {
    const productSchema = z.object({
      name: z.string(),
      description: z.string(),
      price: z.number(),
      category: z.enum(["food", "accessories", "grooming", "training", "safety"]),
      subCategory: z.string(),
      images: z.array(z.string()),
      brand: z.string(),
      stock: z.number(),
      rating: z.number().optional(),
      petType: z.array(z.enum(["dog", "cat", "fish", "bird", "hamster", "rabbit", "guinea_pig", "other"]))
    });

    const validatedData = productSchema.parse(req.body);
    const result = await db.insert(products).values({
      ...validatedData,
      price: sql`${validatedData.price}::decimal`,
      rating: validatedData.rating ? sql`${validatedData.rating}::decimal` : null,
      petType: sql`array[${validatedData.petType}]::text[]`
    });
    res.status(201).json(result);
  }));

  app.get("/api/products/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (!result.length) {
      throw new AppError(404, 'NotFound', 'Product not found');
    }

    res.json(result[0]);
  }));


  app.post("/api/applications", asyncHandler(async (req, res) => {
    // Adjusting the expected structure to include all required fields
    const applicationSchema = z.object({
      petId: z.number(),
      status: z.enum(["pending", "approved", "rejected"]).default("pending"),
      homeType: z.enum(["house", "apartment", "other"]),
      hasYard: z.boolean(),
      otherPets: z.boolean(),
      previousExperience: z.string(),
      income: z.number().optional(),
      occupation: z.string(),
      familySize: z.number(),
      reasonForAdoption: z.string(),
      additionalNotes: z.string().optional(),
      questionnaire: z.object({
        symptoms: z.array(z.string()).optional(),
        treatment: z.string().optional(),
        // Add more fields as necessary
      }).optional(), // Ensure to define any additional required fields
    });

    const validatedData = applicationSchema.parse(req.body);

    // Check if the pet exists and is available
    const pet = await db
      .select()
      .from(pets)
      .where(eq(pets.id, validatedData.petId))
      .limit(1);

    if (!pet.length) {
      throw new AppError(404, 'NotFound', 'Pet not found');
    }

    if (pet[0].status !== 'available') {
      throw new AppError(400, 'InvalidRequest', 'Pet is not available for adoption');
    }

    // Create the adoption application with proper type handling
    const result = await db.insert(adoptionApplications).values({
      petId: validatedData.petId,
      userId: (req.user as { id: number }).id,
      status: validatedData.status,
      questionnaire: sql`${JSON.stringify({
        homeType: validatedData.homeType,
        hasYard: validatedData.hasYard,
        otherPets: validatedData.otherPets,
        previousExperience: validatedData.previousExperience,
        income: validatedData.income,
        occupation: validatedData.occupation,
        familySize: validatedData.familySize,
        reasonForAdoption: validatedData.reasonForAdoption,
        additionalNotes: validatedData.additionalNotes,
        ...validatedData.questionnaire
      })}::jsonb`
    });

    // Update pet status to pending
    await db
      .update(pets)
      .set({ status: 'pending' })
      .where(eq(pets.id, validatedData.petId));

    res.status(201).json(result);
  }));

  // Rest of the routes...
}
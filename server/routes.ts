import type { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { 
  users, pets, shelters, breeders, messages, 
  adoptionApplications, products, cartItems,
  veterinarians, vaccinations, vetAppointments, 
  healthRecords 
} from "@db/schema";
import { eq, and, sql, asc, desc, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// Auth Request interface
interface AuthRequest extends Request {
  user?: { id: number };
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

// Auth middleware
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError(401, 'Unauthorized', 'Authentication required');
  }
  next();
};

// Async handler wrapper
const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

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

export function registerRoutes(app: Express) {
  // Register error handler
  app.use(errorHandler);

  // Shelters endpoint with proper type handling
  app.get("/api/shelters", asyncHandler(async (req, res) => {
    const results = await db
      .select({
        id: shelters.id,
        userId: shelters.userId,
        description: sql<string>`${shelters.description}::text`,
        address: sql<string>`${shelters.address}::text`,
        phone: sql<string>`${shelters.phone}::text`,
        website: shelters.website,
        verificationStatus: shelters.verificationStatus,
        user: {
          id: users.id,
          name: sql<string>`${users.name}::text`,
          email: sql<string>`${users.email}::text`
        }
      })
      .from(shelters)
      .leftJoin(users, eq(shelters.userId, users.id));

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No shelters found');
    }

    // Fetch pets separately to avoid type issues
    const shelterIds = results.map(shelter => shelter.userId);
    const petsResults = await db
      .select({
        shelterId: pets.shelterId,
        id: pets.id,
        name: sql<string>`${pets.name}::text`,
        type: pets.type,
        breed: sql<string>`${pets.breed}::text`,
        status: pets.status,
        images: pets.images
      })
      .from(pets)
      .where(inArray(pets.shelterId, shelterIds));

    // Combine results
    const sheltersWithPets = results.map(shelter => ({
      ...shelter,
      pets: petsResults.filter(pet => pet.shelterId === shelter.userId)
    }));

    res.json(sheltersWithPets);
  }));

  // Products endpoint with proper type handling
  app.get("/api/products", asyncHandler(async (req, res) => {
    const { category, sortBy, petType } = req.query;

    const baseQuery = db
      .select({
        id: products.id,
        name: sql<string>`${products.name}::text`,
        description: sql<string>`${products.description}::text`,
        price: sql<string>`${products.price}::decimal`,
        category: products.category,
        subCategory: products.subCategory,
        images: products.images,
        brand: sql<string>`${products.brand}::text`,
        stock: products.stock,
        rating: sql<string>`${products.rating}::decimal`,
        petType: products.petType,
        createdAt: products.createdAt
      })
      .from(products);

    // Build conditions array
    const conditions = [];
    if (category) {
      conditions.push(eq(products.category, category as string));
    }
    if (petType && petType !== "all") {
      conditions.push(sql`${products.petType}::text[] @> ARRAY[${petType}]::text[]`);
    }

    // Apply where conditions
    let query = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // Apply ordering
    if (sortBy === "price_asc") {
      query = query.orderBy(asc(products.price));
    } else if (sortBy === "price_desc") {
      query = query.orderBy(desc(products.price));
    } else if (sortBy === "rating") {
      query = query.orderBy(desc(products.rating));
    }

    const results = await query;

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No products found');
    }

    res.json(results);
  }));

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
  // Pets routes with proper type handling
  app.get("/api/pets", asyncHandler(async (req, res) => {
    const results = await db
      .select({
        id: pets.id,
        name: sql<string>`${pets.name}::text`,
        type: pets.type,
        breed: sql<string>`${pets.breed}::text`,
        age: pets.age,
        gender: pets.gender,
        size: pets.size,
        description: sql<string>`${pets.description}::text`,
        images: pets.images,
        city: sql<string>`${pets.city}::text`,
        status: pets.status,
        isFromBreeder: pets.isFromBreeder,
        createdAt: pets.createdAt,
        shelter: {
          id: shelters.id,
          name: sql<string>`${users.name}::text`,
          address: sql<string>`${shelters.address}::text`,
          phone: sql<string>`${shelters.phone}::text`,
          verificationStatus: shelters.verificationStatus
        }
      })
      .from(pets)
      .leftJoin(shelters, eq(pets.shelterId, shelters.userId))
      .leftJoin(users, eq(shelters.userId, users.id));

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No pets found');
    }

    res.json(results);
  }));

  app.get("/api/pets/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db
      .select({
        id: pets.id,
        name: sql<string>`${pets.name}::text`,
        type: pets.type,
        breed: sql<string>`${pets.breed}::text`,
        age: pets.age,
        gender: pets.gender,
        size: pets.size,
        description: sql<string>`${pets.description}::text`,
        images: pets.images,
        city: sql<string>`${pets.city}::text`,
        status: pets.status,
        isFromBreeder: pets.isFromBreeder,
        createdAt: pets.createdAt,
        shelter: {
          id: shelters.id,
          name: sql<string>`${users.name}::text`,
          address: sql<string>`${shelters.address}::text`,
          phone: sql<string>`${shelters.phone}::text`,
          verificationStatus: shelters.verificationStatus
        }
      })
      .from(pets)
      .leftJoin(shelters, eq(pets.shelterId, shelters.userId))
      .leftJoin(users, eq(shelters.userId, users.id))
      .where(eq(pets.id, parseInt(id)))
      .limit(1);

    if (!result.length) {
      throw new AppError(404, 'NotFound', 'Pet not found');
    }

    res.json(result[0]);
  }));
  // Products routes with proper type handling
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

  // Add protected route for adoption applications
  app.post("/api/applications", requireAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
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
      }).optional(),
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
      userId: req.user?.id as number,
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
}
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

  // Breeder routes
  app.get("/api/breeders", asyncHandler(async (req, res) => {
    const results = await db
      .select({
        id: breeders.id,
        userId: breeders.userId,
        description: sql<string>`${breeders.description}::text`,
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
      .leftJoin(users, eq(breeders.userId, users.id))
      .orderBy(asc(users.name)); // Order by user's name instead of breeder's name

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No breeders found');
    }

    res.json(results);
  }));

  // Products routes with proper type handling
  app.get("/api/products/:id", asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1)
      .orderBy(asc(products.name)); // Added orderBy for consistent ordering

    if (!result.length) {
      throw new AppError(404, 'NotFound', 'Product not found');
    }

    res.json(result[0]);
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
      .leftJoin(users, eq(shelters.userId, users.id))
      .orderBy(asc(pets.createdAt)); // Added orderBy for consistent ordering

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No pets found');
    }

    res.json(results);
  }));

  // Products routes with filtering and sorting
  app.get("/api/products", asyncHandler(async (req, res) => {
    const { category, sortBy, petType } = req.query;
      
    let query = db.select({
      id: products.id,
      name: sql<string>`${products.name}::text`,
      description: sql<string>`${products.description}::text`,
      price: products.price,
      category: products.category,
      subCategory: products.subCategory,
      images: products.images,
      brand: sql<string>`${products.brand}::text`,
      stock: products.stock,
      rating: products.rating,
      petType: products.petType,
      createdAt: products.createdAt
    }).from(products);

    if (category) {
      query = query.where(eq(products.category, category as string));
    }

    if (petType && petType !== "all") {
      query = query.where(sql`${products.petType}::text[] @> ARRAY[${petType}]::text[]`);
    }

    if (sortBy === "price_asc") {
      query = query.orderBy(asc(products.price));
    } else if (sortBy === "price_desc") {
      query = query.orderBy(desc(products.price));
    } else if (sortBy === "rating") {
      query = query.orderBy(desc(products.rating));
    }

    const results = await query;
    res.json(results);
  }));

  // Shelters routes with pet associations
  app.get("/api/shelters", asyncHandler(async (req, res) => {
    const shelterResults = await db
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

    // Fetch pets for each shelter
    const shelterIds = shelterResults.map(shelter => shelter.userId);
    const petsResults = await db
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
        status: pets.status,
        shelterId: pets.shelterId
      })
      .from(pets)
      .where(inArray(pets.shelterId, shelterIds));

    // Combine results
    const sheltersWithPets = shelterResults.map(shelter => ({
      ...shelter,
      pets: petsResults.filter(pet => pet.shelterId === shelter.userId)
    }));

    if (!sheltersWithPets.length) {
      throw new AppError(404, 'NotFound', 'No shelters found');
    }

    res.json(sheltersWithPets);
  }));

  // Add other routes as necessary...

}
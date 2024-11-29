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

  if (error instanceof z.ZodError) {
    return res.status(400).json({
      type: 'ValidationError',
      message: 'Invalid request data',
      details: error.errors,
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
      .leftJoin(users, eq(breeders.userId, users.id));
    
    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No breeders found');
    }
    
    res.json(results);
  }));

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
  app.post("/api/auth/register", asyncHandler(async (req, res) => {
    // Validate request body
    const userSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(2),
      type: z.enum(["adopter_buyer", "shelter_ngo", "breeder", "expert_consultant"]),
    });

    const validatedData = userSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      throw new AppError(409, 'Conflict', 'Email already registered');
    }

    const user = await db
      .insert(users)
      .values({
        ...validatedData,
        password: hashedPassword,
      })
      .returning();
    
    req.session.userId = user[0].id;
    res.json({ user: user[0] });
  }));

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

  

  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = loginSchema.parse(req.body);
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError(401, 'Unauthorized', 'Invalid credentials');
    }

    req.session.userId = user.id;
    res.json({ user });
  }));

  // Pet routes
  app.get("/api/pets", asyncHandler(async (req, res) => {
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
      if (isNaN(minYears)) {
        throw new AppError(400, 'ValidationError', 'Invalid age years format');
      }
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
      
      if (!monthRanges[filters.ageMonths]) {
        throw new AppError(400, 'ValidationError', 'Invalid age months range');
      }
      
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
    
    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No pets found matching the criteria');
    }
    
    res.json(results);
  }));

  app.post("/api/pets", upload.array("images", 5), async (req: Request & { files?: any }, res) => {
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
        req.files.forEach((file: Express.Multer.File) => {
          fs.unlinkSync(file.path);
        });
      }
      res.status(400).json({ error: "Failed to create pet listing" });
    }
  });

  // Shelter routes
  app.get("/api/shelters", asyncHandler(async (req, res) => {
    const results = await db
      .select({
        id: shelters.id,
        userId: shelters.userId,
        description: sql<string>`${shelters.description}::text`,
        address: sql<string>`${shelters.address}::text`,
        phone: sql<string>`${shelters.phone}::text`,
        website: sql<string>`${shelters.website}::text`,
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
    
    res.json(results);
  }));

  // Messages routes
  app.post("/api/messages", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to send messages');
    }

    const messageSchema = z.object({
      toUserId: z.number(),
      content: z.string().min(1, 'Message content cannot be empty'),
    });

    const validatedData = messageSchema.parse(req.body);

    // Verify recipient user exists
    const recipientUser = await db.query.users.findFirst({
      where: eq(users.id, validatedData.toUserId),
    });

    if (!recipientUser) {
      throw new AppError(404, 'NotFound', 'Recipient user not found');
    }

    const message = await db
      .insert(messages)
      .values({
        fromUserId: req.session.userId,
        ...validatedData,
      })
      .returning();

    res.json(message[0]);
  }));

  // Adoption application routes
  app.post("/api/applications", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to submit an adoption application');
    }

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
    });

    const validatedData = applicationSchema.parse(req.body);

    // Verify pet exists and is available
    const pet = await db.query.pets.findFirst({
      where: and(
        eq(pets.id, validatedData.petId),
        eq(pets.status, "available")
      ),
    });

    if (!pet) {
      throw new AppError(404, 'NotFound', 'Pet not found or is no longer available for adoption');
    }

    // Check if user already has a pending application for this pet
    const existingApplication = await db
      .select()
      .from(adoptionApplications)
      .where(
        and(
          eq(adoptionApplications.userId, req.session.userId),
          eq(adoptionApplications.petId, validatedData.petId),
          eq(adoptionApplications.status, "pending")
        )
      );

    if (existingApplication.length > 0) {
      throw new AppError(409, 'Conflict', 'You already have a pending application for this pet');
    }

    const application = await db
      .insert(adoptionApplications)
      .values({
        userId: req.session.userId,
        ...validatedData,
      })
      .returning();

    res.json(application[0]);
  }));

  // Product routes
  app.get("/api/auth/check", (req, res) => {
    console.log("Session:", req.session);
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ authenticated: true, userId: req.session.userId });
  });

  // Add auth middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Apply middleware to cart routes
  app.use("/api/cart", requireAuth);

  app.get("/api/products", asyncHandler(async (req, res) => {
    const filterSchema = z.object({
      category: z.enum(["food", "accessories", "grooming", "training", "safety"]).optional(),
      sortBy: z.enum(["price_asc", "price_desc", "rating"]).optional(),
      petType: z.string().optional(),
    });

    const { category, sortBy, petType } = filterSchema.parse(req.query);
    const baseQuery = db.select().from(products);
    
    let query = baseQuery;
    
    if (category) {
      query = baseQuery.where(eq(products.category, category));
    }
    
    if (petType && petType !== "all") {
      query = baseQuery.where(sql`${products.petType} @> ARRAY[${petType}]::text[]`);
    }

    // Apply sorting
    if (sortBy) {
      switch(sortBy) {
        case "price_asc":
          query = baseQuery.orderBy(asc(products.price));
          break;
        case "price_desc":
          query = baseQuery.orderBy(desc(products.price));
          break;
        case "rating":
          query = baseQuery.orderBy(desc(products.rating));
          break;
      }
    }
    
    const results = await query;
    
    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No products found matching the criteria');
    }
    
    res.json(results);
  }));

  app.get("/api/products/:id", asyncHandler(async (req, res) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      throw new AppError(400, 'ValidationError', 'Invalid product ID format');
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    
    if (!product) {
      throw new AppError(404, 'NotFound', 'Product not found');
    }
    
    res.json(product);
  }));

  // Cart routes
  app.get("/api/cart", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to view cart items');
    }

    const items = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        product: products
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, req.session.userId));

    if (!items.length) {
      throw new AppError(404, 'NotFound', 'Your cart is empty');
    }

    res.json(items);
  }));

  app.post("/api/cart", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to add items to cart');
    }

    const cartItemSchema = z.object({
      productId: z.number(),
      quantity: z.number().min(1).default(1),
      price: z.number().min(0),
    });

    const validatedData = cartItemSchema.parse(req.body);

    // Verify product exists
    const product = await db.query.products.findFirst({
      where: eq(products.id, validatedData.productId),
    });

    if (!product) {
      throw new AppError(404, 'NotFound', 'Product not found');
    }

    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, req.session.userId),
        eq(cartItems.productId, validatedData.productId)
      ))
      .limit(1);

    if (existingItem.length > 0) {
      // Update quantity if item exists
      const updated = await db
        .update(cartItems)
        .set({ 
          quantity: existingItem[0].quantity + validatedData.quantity
        })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return res.json(updated[0]);
    }

    // Add new item if it doesn't exist
    const cartItem = await db
      .insert(cartItems)
      .values({
        userId: req.session.userId,
        productId: validatedData.productId,
        quantity: validatedData.quantity
      })
      .returning();

    res.json(cartItem[0]);
  }));

  app.patch("/api/cart/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to update cart items');
    }

    const cartItemSchema = z.object({
      quantity: z.number().min(1),
    });

    const validatedData = cartItemSchema.parse(req.body);
    const cartItemId = parseInt(req.params.id);

    if (isNaN(cartItemId)) {
      throw new AppError(400, 'ValidationError', 'Invalid cart item ID format');
    }

    const cartItem = await db
      .update(cartItems)
      .set({ quantity: validatedData.quantity })
      .where(and(
        eq(cartItems.id, cartItemId),
        eq(cartItems.userId, req.session.userId)
      ))
      .returning();
    
    if (!cartItem.length) {
      throw new AppError(404, 'NotFound', 'Cart item not found');
    }
    
    res.json(cartItem[0]);
  }));

  app.delete("/api/cart/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to remove cart items');
    }

    const cartItemId = parseInt(req.params.id);
    if (isNaN(cartItemId)) {
      throw new AppError(400, 'ValidationError', 'Invalid cart item ID format');
    }

    await db
      .delete(cartItems)
      .where(and(
        eq(cartItems.id, cartItemId),
        eq(cartItems.userId, req.session.userId)
      ));

    res.status(204).end();
  }));

  // Health Services Routes
  app.get("/api/veterinarians", asyncHandler(async (req, res) => {
    const results = await db
      .select({
        id: veterinarians.id,
        userId: veterinarians.userId,
        specializations: veterinarians.specializations,
        qualifications: veterinarians.qualifications,
        clinicAddress: veterinarians.clinicAddress,
        clinicPhone: veterinarians.clinicPhone,
        availableSlots: veterinarians.availableSlots,
        rating: veterinarians.rating,
        user: {
          id: users.id,
          name: sql<string>`${users.name}::text`,
          email: sql<string>`${users.email}::text`
        }
      })
      .from(veterinarians)
      .leftJoin(users, eq(veterinarians.userId, users.id));
      
    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No veterinarians found');
    }
    
    res.json(results);
  }));

  app.post("/api/veterinarians", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to create a veterinarian profile');
    }

    const vetSchema = z.object({
      specializations: z.array(z.string()),
      qualifications: z.array(z.string()),
      clinicAddress: z.string(),
      clinicPhone: z.string(),
      availableSlots: z.record(z.string(), z.array(z.string())),
    });

    const validatedData = vetSchema.parse(req.body);
    
    const existingVet = await db.query.veterinarians.findFirst({
      where: eq(veterinarians.userId, req.session.userId),
    });

    if (existingVet) {
      throw new AppError(409, 'Conflict', 'Veterinarian profile already exists for this user');
    }

    const vet = await db
      .insert(veterinarians)
      .values({
        userId: req.session.userId,
        ...validatedData,
      })
      .returning();

    res.json(vet[0]);
  }));

  app.get("/api/vaccinations/:petId", asyncHandler(async (req, res) => {
    const petId = parseInt(req.params.petId);
    if (isNaN(petId)) {
      throw new AppError(400, 'ValidationError', 'Invalid pet ID format');
    }

    const results = await db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.petId, petId));

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No vaccination records found for this pet');
    }

    res.json(results);
  }));

  app.post("/api/vaccinations", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to create vaccination records');
    }

    const vaccinationSchema = z.object({
      petId: z.number(),
      name: z.string(),
      date: z.string().transform(str => new Date(str)),
      nextDueDate: z.string().transform(str => new Date(str)).optional(),
      veterinarianId: z.number().optional(),
      notes: z.string().optional(),
      documentUrl: z.string().optional(),
    });

    const validatedData = vaccinationSchema.parse(req.body);

    // Verify pet exists
    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, validatedData.petId),
    });

    if (!pet) {
      throw new AppError(404, 'NotFound', 'Pet not found');
    }

    const vaccination = await db
      .insert(vaccinations)
      .values(validatedData)
      .returning();

    res.json(vaccination[0]);
  }));

  app.get("/api/appointments", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to view appointments');
    }

    const results = await db
      .select({
        id: vetAppointments.id,
        petId: vetAppointments.petId,
        dateTime: vetAppointments.dateTime,
        type: vetAppointments.type,
        status: vetAppointments.status,
        notes: vetAppointments.notes,
        veterinarian: {
          id: veterinarians.id,
          clinicAddress: veterinarians.clinicAddress,
          clinicPhone: veterinarians.clinicPhone,
          user: {
            id: users.id,
            name: users.name,
            email: users.email
          }
        }
      })
      .from(vetAppointments)
      .leftJoin(veterinarians, eq(vetAppointments.veterinarianId, veterinarians.id))
      .leftJoin(users, eq(veterinarians.userId, users.id))
      .where(eq(vetAppointments.userId, req.session.userId));

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No appointments found');
    }

    res.json(results);
  }));

  // Video consultation signaling
app.post("/api/video-signal", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { signal, appointmentId, type } = req.body;
    
    // Store the signal in the database or temporary storage
    // For now, we'll just echo it back
    res.json({ signal });
  } catch (error) {
    console.error('Error in video signaling:', error);
    res.status(500).json({ error: "Failed to process video signal" });
  }
});

app.post("/api/appointments", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to create appointments');
    }

    const appointmentSchema = z.object({
      petId: z.number(),
      veterinarianId: z.number(),
      dateTime: z.string().transform(str => new Date(str)),
      type: z.enum(["checkup", "vaccination", "emergency", "grooming", "consultation"]),
      notes: z.string().optional(),
    });

    const validatedData = appointmentSchema.parse(req.body);

    // Verify pet exists
    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, validatedData.petId),
    });

    if (!pet) {
      throw new AppError(404, 'NotFound', 'Pet not found');
    }

    // Verify veterinarian exists
    const vet = await db.query.veterinarians.findFirst({
      where: eq(veterinarians.id, validatedData.veterinarianId),
    });

    if (!vet) {
      throw new AppError(404, 'NotFound', 'Veterinarian not found');
    }

    const appointment = await db
      .insert(vetAppointments)
      .values({
        userId: req.session.userId,
        ...validatedData,
        status: "scheduled",
      })
      .returning();

    res.json(appointment[0]);
  }));

  // QR Code Generation endpoint
  app.post("/api/generate-qr", async (req, res) => {
    try {
      const { recordId, animalType, recordType, date, description } = req.body;
      
      // Create a unique shareable link
      const shareableLink = `${process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
        : 'http://localhost:5000'}/shared-record/${recordId}`;

      // Generate QR code
      const QRCode = require('qrcode');
      const qrUrl = await QRCode.toDataURL(shareableLink);

      res.json({ qrUrl, shareableLink });
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  app.get("/api/health-records/:petId", asyncHandler(async (req, res) => {
    const petId = parseInt(req.params.petId);
    if (isNaN(petId)) {
      throw new AppError(400, 'ValidationError', 'Invalid pet ID format');
    }

    // Verify pet exists
    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, petId),
    });

    if (!pet) {
      throw new AppError(404, 'NotFound', 'Pet not found');
    }

    const results = await db
      .select()
      .from(healthRecords)
      .where(eq(healthRecords.petId, petId));

    if (!results.length) {
      throw new AppError(404, 'NotFound', 'No health records found for this pet');
    }

    res.json(results);
  }));

  app.post("/api/health-records", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      throw new AppError(401, 'Unauthorized', 'You must be logged in to create health records');
    }

    const healthRecordSchema = z.object({
      petId: z.number(),
      type: z.enum(["condition", "medication", "allergy", "surgery", "test_result"]),
      description: z.string(),
      date: z.string().transform(str => new Date(str)),
      severity: z.enum(["low", "medium", "high"]).optional(),
      notes: z.string().optional(),
      veterinarianId: z.number().optional(),
      documentUrl: z.string().optional(),
      attachments: z.array(z.string()).optional(),
    });

    const validatedData = healthRecordSchema.parse(req.body);

    // Verify pet exists
    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, validatedData.petId),
    });

    if (!pet) {
      throw new AppError(404, 'NotFound', 'Pet not found');
    }

    // If veterinarianId is provided, verify veterinarian exists
    if (validatedData.veterinarianId) {
      const vet = await db.query.veterinarians.findFirst({
        where: eq(veterinarians.id, validatedData.veterinarianId),
      });

      if (!vet) {
        throw new AppError(404, 'NotFound', 'Veterinarian not found');
      }
    }

    const record = await db
      .insert(healthRecords)
      .values(validatedData)
      .returning();

    res.json(record[0]);
  }));
  // Shared record view endpoint
  app.get("/api/shared-record/:recordId", async (req, res) => {
    try {
      const record = await db
        .select({
          id: healthRecords.id,
          type: healthRecords.type,
          description: healthRecords.description,
          date: healthRecords.date,
          severity: healthRecords.severity,
          attachments: healthRecords.attachments,
          notes: healthRecords.notes,
          pet: {
            id: pets.id,
            name: pets.name,
            type: pets.type,
            breed: pets.breed,
            age: pets.age
          }
        })
        .from(healthRecords)
        .leftJoin(pets, eq(healthRecords.petId, pets.id))
        .where(eq(healthRecords.id, parseInt(req.params.recordId)))
        .limit(1);

      if (!record.length) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.json(record[0]);
    } catch (error) {
      console.error('Error fetching shared record:', error);
      res.status(500).json({ error: "Failed to fetch shared record" });
    }
  });
}
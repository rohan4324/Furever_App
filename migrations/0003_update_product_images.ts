import { sql } from "drizzle-orm";
import { products } from "../db/schema";

export async function up(db: any) {
  // Update product images with real paths
  await db.update(products)
    .set({
      images: sql`ARRAY['/images/products/royal-canin-premium.jpg']::text[]`
    })
    .where(sql`name = 'Royal Canin Premium Dog Food'`);

  await db.update(products)
    .set({
      images: sql`ARRAY['/images/products/hills-science-diet.jpg']::text[]`
    })
    .where(sql`name = 'Hill''s Science Diet Cat Food'`);

  await db.update(products)
    .set({
      images: sql`ARRAY['/images/products/luxury-pet-bed.jpg']::text[]`
    })
    .where(sql`name = 'Luxury Cat Bed'`);

  // Add more sample products with images
  const sampleProducts = [
    {
      name: "Professional Grooming Kit",
      description: "Complete grooming kit for all pet types",
      price: "89.99",
      category: "grooming",
      sub_category: "tools",
      images: sql`ARRAY['/images/products/grooming-kit.jpg']::text[]`,
      brand: "PetCare Pro",
      stock: 45,
      rating: "4.6",
      pet_type: sql`ARRAY['dog', 'cat']::text[]`
    },
    {
      name: "Advanced Training Leash",
      description: "Professional grade training leash with multiple attachment points",
      price: "34.99",
      category: "training",
      sub_category: "leashes",
      images: sql`ARRAY['/images/products/training-leash.jpg']::text[]`,
      brand: "TrainRight",
      stock: 60,
      rating: "4.7",
      pet_type: sql`ARRAY['dog']::text[]`
    },
    {
      name: "Pet Safety Harness",
      description: "Durable safety harness with reflective strips",
      price: "29.99",
      category: "safety",
      sub_category: "harnesses",
      images: sql`ARRAY['/images/products/safety-harness.jpg']::text[]`,
      brand: "SafePet",
      stock: 75,
      rating: "4.8",
      pet_type: sql`ARRAY['dog', 'cat']::text[]`
    }
  ];

  // Insert new sample products
  for (const product of sampleProducts) {
    await db.insert(products).values(product);
  }
}

export async function down(db: any) {
  // No destructive operations in down migration
  return sql`SELECT 1`;
}

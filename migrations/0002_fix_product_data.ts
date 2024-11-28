import { sql } from "drizzle-orm";
import { products } from "../db/schema";

export async function up(db: any) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  
  const sampleProducts = [
    {
      name: "Royal Canin Premium Dog Food",
      description: "Premium dry dog food for adult dogs. Complete nutrition with optimal protein and fiber balance.",
      price: "49.99",
      category: "food",
      sub_category: "dry_food",
      images: ["/images/products/royal-canin-dog.jpg"],
      brand: "Royal Canin",
      stock: 100,
      rating: "4.8",
      pet_type: ["dog"]
    },
    {
      name: "Luxury Cat Bed",
      description: "Plush, comfortable bed for cats with removable washable cover.",
      price: "45.99",
      category: "accessories",
      sub_category: "beds",
      images: ["/images/products/cat-bed.jpg"],
      brand: "PetComfort",
      stock: 50,
      rating: "4.7",
      pet_type: ["cat"]
    }
  ];

  // Insert sample products using parameterized query
  for (const product of sampleProducts) {
    await db.insert(products).values({
      ...product,
      pet_type: sql`ARRAY[${product.pet_type}]::text[]`
    });
  }
}

export async function down(db: any) {
  await db.delete(products);
}

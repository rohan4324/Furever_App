import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";

export async function up(db: any) {
  const sampleProducts = [
    {
      name: "Royal Canin Premium Dog Food",
      description: "Premium dry dog food for adult dogs",
      price: "49.99",
      category: "food",
      subCategory: "dry_food",
      images: ["/images/products/royal-canin-dog.jpg"],
      brand: "Royal Canin",
      stock: 100,
      rating: "4.8",
      petType: ["dog"]
    },
    {
      name: "Hill's Science Diet Cat Food",
      description: "Adult indoor cat nutrition",
      price: "39.99",
      category: "food",
      subCategory: "dry_food",
      images: ["/images/products/hills-cat.jpg"],
      brand: "Hill's",
      stock: 85,
      rating: "4.7",
      petType: ["cat"]
    }
  ];

  // Add sample products
  await db.insert(pgTable("products")).values(sampleProducts);
}

export async function down(db: any) {
  // We don't want to delete products, just in case they've been modified
  // Instead, we'll leave them as is
  return sql`SELECT 1`;
}

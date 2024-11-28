import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function ShopCategory() {
  const [location] = useLocation();
  const category = location.split("/")[2] || "food";
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "rating">("rating");
  const [petType, setPetType] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category, sortBy, petType],
    queryFn: async () => {
      const params = new URLSearchParams({
        category,
        sortBy,
        petType: petType === "all" ? "" : petType,
      });
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.details || "Failed to fetch products");
      }
      return res.json() as Promise<Product[]>;
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : "Failed to fetch products");
    },
  });

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 capitalize">
          {category.replace("_", " ")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find the best {category} products for your pets
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={petType} onValueChange={setPetType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by pet type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pets</SelectItem>
              <SelectItem value="dog">Dogs</SelectItem>
              <SelectItem value="cat">Cats</SelectItem>
              <SelectItem value="fish">Fish</SelectItem>
              <SelectItem value="bird">Birds</SelectItem>
              <SelectItem value="hamster">Hamsters</SelectItem>
              <SelectItem value="rabbit">Rabbits</SelectItem>
              <SelectItem value="guinea_pig">Guinea Pigs</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/images/products/placeholder.jpg';
                  }}
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                <div className="flex justify-between items-center">
                  <span className="font-medium">${product.price}</span>
                  <Button
                    variant="outline"
                    onClick={() => location.assign(`/shop/product/${product.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

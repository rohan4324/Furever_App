import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@db/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ShopCategory() {
  const [location] = useLocation();
  const category = location.split("/")[2] || "food";
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "rating">("rating");
  const [petType, setPetType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add auth check query
  const { data: authData } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const res = await fetch("/api/auth/check", {
        credentials: "include"
      });
      if (!res.ok) return null;
      return res.json();
    }
  });

  const handleBuyNow = async (productId: number) => {
    if (!authData) {
      toast({
        title: "Authentication required",
        description: "Please login to continue with purchase",
        variant: "destructive",
      });
      window.location.assign('/login');
      return;
    }
    window.location.assign('/checkout');
  };

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (!authData) {
        window.location.assign('/login');
        throw new Error("Please login to add items to cart");
      }
      
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add to cart");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "The item has been added to your cart.",
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const { data: products, isLoading, error: fetchError } = useQuery({
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
  });

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {fetchError instanceof Error ? fetchError.message : "Failed to fetch products"}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end items-center gap-2">
          <Link to="/cart" className="flex items-center gap-2 hover:text-primary">
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>
        <div className="w-full max-w-md mx-auto">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

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
          {products?.filter(product => 
            searchQuery === "" || 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="aspect-square overflow-hidden">
                <img
                  src={product.images[0]?.startsWith('/') 
                    ? product.images[0] 
                    : `/images/products/${product.images[0]}`}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/products/placeholder.jpg';
                  }}
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                
                <div className="mt-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">${product.price}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => addToCartMutation.mutate(product.id)}
                        disabled={addToCartMutation.isPending}
                      >
                        {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleBuyNow(product.id)}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

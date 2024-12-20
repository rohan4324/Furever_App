import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: number;
  name: string;
  price: string;
  images: string[];
  brand: string;
  description: string;
  category: string;
  subCategory: string;
  petType: string[];
  stock: number;
}

export default function ProductDetails() {
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const [location] = useLocation();
  const productId = location.split('/').pop();
  const queryClient = useQueryClient();

  if (!productId) {
    return <div className="text-center py-8">Product not found</div>;
  }

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json() as Promise<Product>;
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const authCheck = await fetch('/api/auth/check', {
        credentials: 'include'
      });
    
      if (!authCheck.ok) {
        window.location.assign('/login');
        throw new Error("Please login to add items to cart");
      }

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
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
      if (error instanceof Error && error.message === "Please login to add items to cart") {
        window.location.assign('/login');
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg">
            <img
              src={product.images[0]?.startsWith('/') ? product.images[0] : `/images/products/${product.images[0]}`}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = '/images/products/placeholder.jpg';
              }}
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images && product.images.length > 1 && 
              product.images.slice(1).map((image, index) => (
                <img
                  key={index}
                  src={image.startsWith('/') ? image : `/images/products/${image}`}
                  alt={`${product.name} view ${index + 2}`}
                  className="aspect-square rounded-lg object-cover cursor-pointer hover:opacity-80"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = '/images/products/placeholder.jpg';
                  }}
                />
              ))
            }
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-xl font-semibold text-primary">${product.price}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Brand: {product.brand}</p>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={quantity.toString()}
                onValueChange={(value) => setQuantity(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Quantity" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(10)].map((_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-sm text-muted-foreground">
                {product.stock} items in stock
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? "Adding to Cart..." : "Add to Cart"}
            </Button>
          </div>

          <div className="border-t pt-6">
            <h2 className="font-semibold mb-2">Product Details</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium">Category:</span>{" "}
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </li>
              <li>
                <span className="font-medium">Sub-category:</span>{" "}
                {product.subCategory}
              </li>
              <li>
                <span className="font-medium">Suitable for:</span>{" "}
                {Array.isArray(product.petType) ? product.petType.join(", ") : product.petType}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

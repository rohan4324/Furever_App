import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PetCard from "../components/pets/PetCard";
import PetFilters from "../components/pets/PetFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Pet } from "@db/schema";

type FilterState = {
  type?: string;
  breed?: string;
  size?: string;
  age?: string;
};

export default function PetListings() {
  const [filters, setFilters] = useState<FilterState>({});

  const { data: pets, isLoading } = useQuery({
    queryKey: ["pets", filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters as Record<string, string>);
      const res = await fetch(`/api/pets?${params}`);
      if (!res.ok) throw new Error("Failed to fetch pets");
      return res.json() as Promise<Pet[]>;
    },
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Find Your Perfect Companion</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse through our available pets and find your new best friend. Use the filters to narrow down your search.
        </p>
      </div>

      <PetFilters onFilterChange={setFilters} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets?.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}

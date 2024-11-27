import { useQuery } from "@tanstack/react-query";
import BreederCard from "../components/breeder/BreederCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Breeder, User } from "@db/schema";

type BreederWithUser = Breeder & { user: User };

export default function Breeders() {
  const { data: breeders, isLoading } = useQuery({
    queryKey: ["breeders"],
    queryFn: async () => {
      const res = await fetch("/api/breeders");
      if (!res.ok) throw new Error("Failed to fetch breeders");
      return res.json() as Promise<BreederWithUser[]>;
    },
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Professional Pet Breeders</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect with verified breeders who follow ethical breeding practices and provide healthy, well-cared-for pets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className="h-[300px] rounded-lg" />
            ))
          : breeders?.map((breeder) => (
              <BreederCard key={`breeder-${breeder.id}`} breeder={breeder} />
            ))}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import ShelterCard from "../components/shelter/ShelterCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Shelter, User } from "@db/schema";

type ShelterWithUser = Shelter & { user: User };

export default function Shelters() {
  const { data: shelters, isLoading } = useQuery({
    queryKey: ["shelters"],
    queryFn: async () => {
      const res = await fetch("/api/shelters");
      if (!res.ok) throw new Error("Failed to fetch shelters");
      return res.json() as Promise<ShelterWithUser[]>;
    },
  });

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Our Partner Shelters</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Meet the amazing shelters and NGOs that work tirelessly to care for animals in need.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-lg" />
            ))
          : shelters?.map((shelter) => (
              <ShelterCard key={shelter.id} shelter={shelter} />
            ))}
      </div>
    </div>
  );
}

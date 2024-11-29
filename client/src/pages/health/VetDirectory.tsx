import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star } from "lucide-react";

export default function VetDirectoryPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState<string>("");

  const { data: veterinarians, isLoading } = useQuery({
    queryKey: ["veterinarians"],
    queryFn: async () => {
      const res = await fetch("/api/veterinarians");
      if (!res.ok) throw new Error("Failed to fetch veterinarians");
      return res.json();
    },
  });

  const filteredVets = veterinarians?.filter((vet: any) => {
    const matchesSearch = vet.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.clinicAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = !specialization || vet.specializations.includes(specialization);
    return matchesSearch && matchesSpecialization;
  });

  const handleBookAppointment = async (vetId: number) => {
    toast({
      title: "Coming Soon",
      description: "Appointment booking will be available soon!",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Find a Veterinarian</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-1/2"
        />
        <Select value={specialization} onValueChange={setSpecialization}>
          <SelectTrigger className="md:w-1/3">
            <SelectValue placeholder="Filter by specialization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Specializations</SelectItem>
            <SelectItem value="general">General Practice</SelectItem>
            <SelectItem value="surgery">Surgery</SelectItem>
            <SelectItem value="dermatology">Dermatology</SelectItem>
            <SelectItem value="dentistry">Dentistry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVets?.map((vet: any) => (
            <Card key={vet.id}>
              <CardHeader>
                <CardTitle>{vet.user.name}</CardTitle>
                <div className="flex items-center mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (vet.rating || 0)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {vet.clinicAddress}
                  </p>
                  <p className="text-sm">
                    Specializations: {vet.specializations.join(", ")}
                  </p>
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleBookAppointment(vet.id)}
                  >
                    Book Appointment
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

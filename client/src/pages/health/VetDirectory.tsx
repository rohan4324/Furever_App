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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Star, Phone, MapPin, Award, Clock } from "lucide-react";

export default function VetDirectoryPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const { data: veterinarians, isLoading } = useQuery({
    queryKey: ["veterinarians"],
    queryFn: async () => {
      const res = await fetch("/api/veterinarians");
      if (!res.ok) throw new Error("Failed to fetch veterinarians");
      return res.json();
    },
  });

  const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: async () => {
      const res = await fetch("/api/pets");
      if (!res.ok) throw new Error("Failed to fetch pets");
      return res.json();
    },
  });

  const filteredVets = veterinarians?.filter((vet: any) => {
    const matchesSearch = vet.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.clinicAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = !specialization || vet.specializations.includes(specialization);
    return matchesSearch && matchesSpecialization;
  });

  const handleBookAppointment = async (vet: any) => {
    try {
      if (!selectedDate) {
        toast({
          title: "Error",
          description: "Please select a date for the appointment",
          variant: "destructive",
        });
        return;
      }

      // Basic validation of available slots
      const availableSlots = vet.availableSlots[format(selectedDate, "yyyy-MM-dd")];
      if (!availableSlots || availableSlots.length === 0) {
        toast({
          title: "No Available Slots",
          description: "No available time slots for the selected date.",
          variant: "destructive",
        });
        return;
      }

      // Create appointment
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          veterinarianId: vet.id,
          dateTime: selectedDate.toISOString(),
          type: "consultation",
          status: "scheduled",
          notes: `Appointment with ${vet.user.name}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to book appointment");
      }

      const appointment = await response.json();
      toast({
        title: "Success",
        description: "Appointment booked successfully!",
      });
      setIsBookingDialogOpen(false);
      setSelectedDate(undefined);
      setSelectedVet(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book appointment",
        variant: "destructive",
      });
    }
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
        <div className="flex items-center justify-center h-64">
          <p className="text-lg">Loading veterinarians...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVets?.map((vet: any) => (
            <Card key={vet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{vet.user.name}</span>
                  <div className="flex items-center">
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{vet.clinicAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{vet.clinicPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4" />
                    <span>Specializations: {vet.specializations.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Qualifications: {vet.qualifications.join(", ")}</span>
                  </div>
                  
                  <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full mt-4"
                        onClick={() => {
                          setSelectedVet(vet);
                          setIsBookingDialogOpen(true);
                        }}
                      >
                        Book Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Book Appointment with {vet.user.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select Date</label>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border"
                            disabled={(date) => {
                              return !vet.availableSlots[format(date, "yyyy-MM-dd")];
                            }}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => handleBookAppointment(vet)}
                          disabled={!selectedDate}
                        >
                          Confirm Booking
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

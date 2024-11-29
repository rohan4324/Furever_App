import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Star, Phone, MapPin, Award, Clock, AlertCircle, Loader2, Search, Filter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Pet } from "@db/schema";

interface TimeSlots {
  [key: string]: string[];
}

interface VetWithUser {
  id: number;
  userId: number;
  specializations: string[];
  qualifications: string[];
  clinicAddress: string;
  clinicPhone: string;
  availableSlots: TimeSlots;
  rating: number | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface AppointmentData {
  veterinarianId: number;
  petId: number;
  dateTime: string;
  type: "consultation";
  status: "scheduled";
  notes: string;
}

export default function VetDirectoryPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedVet, setSelectedVet] = useState<VetWithUser | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  // Fetch veterinarians
  const { data: veterinarians, isLoading, error } = useQuery<VetWithUser[]>({
    queryKey: ["veterinarians"],
    queryFn: async () => {
      const res = await fetch("/api/veterinarians");
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to fetch veterinarians");
      }
      return res.json();
    },
  });

  // Fetch pets
  const { data: pets, isLoading: isPetsLoading } = useQuery<Pet[]>({
    queryKey: ["pets"],
    queryFn: async () => {
      const res = await fetch("/api/pets");
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to fetch pets");
      }
      return res.json();
    },
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: AppointmentData) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointmentData),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to book appointment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment booked successfully!",
      });
      setIsBookingDialogOpen(false);
      setSelectedDate(undefined);
      setSelectedTimeSlot("");
      setSelectedPetId("");
      setSelectedVet(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  const filteredVets = veterinarians?.filter((vet) => {
    const matchesSearch = 
      vet.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.clinicAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = 
      !specialization || 
      specialization === "all" || 
      vet.specializations.includes(specialization);
    
    // Check availability if date and time are selected
    let isAvailable = true;
    if (selectedDate && selectedTimeSlot) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const availableSlots = vet.availableSlots[dateStr] || [];
      isAvailable = availableSlots.includes(selectedTimeSlot);
    }
    
    return matchesSearch && matchesSpecialization && isAvailable;
  });

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedPetId || !selectedVet) {
      toast({
        title: "Error",
        description: "Please select all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate selected time slot is still available
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const availableSlots = selectedVet.availableSlots[dateStr] || [];
    if (!availableSlots.includes(selectedTimeSlot)) {
      toast({
        title: "Error",
        description: "Selected time slot is no longer available. Please choose another time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Check for existing appointments at the same time
      const existingAppointments = await fetch(
        `/api/appointments?date=${appointmentDateTime.toISOString()}&veterinarianId=${selectedVet.id}`
      ).then((res) => res.json());

      if (existingAppointments?.length > 0) {
        toast({
          title: "Error",
          description: "This time slot has just been booked. Please select another time.",
          variant: "destructive",
        });
        return;
      }

      bookAppointmentMutation.mutate({
        veterinarianId: selectedVet.id,
        petId: parseInt(selectedPetId),
        dateTime: appointmentDateTime.toISOString(),
        type: "consultation",
        status: "scheduled",
        notes: `Appointment with ${selectedVet.user.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAvailableTimeSlots = (date: Date, vet: VetWithUser): string[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return vet.availableSlots[dateStr] || [];
  };

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load veterinarians"}
        </AlertDescription>
      </Alert>
    );
  }

  const renderSkeletonCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Find a Veterinarian</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative md:w-1/3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative md:w-1/3">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Select value={specialization} onValueChange={setSpecialization}>
            <SelectTrigger className="pl-9">
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              <SelectItem value="general">General Practice</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
              <SelectItem value="dermatology">Dermatology</SelectItem>
              <SelectItem value="dentistry">Dentistry</SelectItem>
              <SelectItem value="emergency">Emergency Care</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative md:w-1/3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-lg border"
            disabled={(date) => date < new Date()}
          />
        </div>
      </div>
      
      {selectedDate && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Available Time Slots</h3>
          <div className="flex flex-wrap gap-2">
            {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((time) => (
              <Button
                key={time}
                variant={selectedTimeSlot === time ? "default" : "outline"}
                onClick={() => setSelectedTimeSlot(time)}
                className="w-24"
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        renderSkeletonCards()
      ) : !veterinarians || veterinarians.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No veterinarians found. Please check back later.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVets?.map((vet) => (
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
                  <div className="flex flex-wrap gap-2">
                    {vet.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4" />
                    <span className="text-xs">{vet.qualifications.join(", ")}</span>
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
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Book Appointment with {vet.user.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        {/* Pet Selection */}
                        <div className="space-y-2">
                          <Label>Select Pet</Label>
                          <Select 
                            value={selectedPetId} 
                            onValueChange={setSelectedPetId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a pet" />
                            </SelectTrigger>
                            <SelectContent>
                              {isPetsLoading ? (
                                <SelectItem value="" disabled>Loading pets...</SelectItem>
                              ) : !pets?.length ? (
                                <SelectItem value="" disabled>No pets found</SelectItem>
                              ) : (
                                pets.map((pet) => (
                                  <SelectItem key={pet.id} value={pet.id.toString()}>
                                    {pet.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date Selection */}
                        <div className="space-y-2">
                          <Label>Select Date</Label>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              setSelectedTimeSlot("");
                            }}
                            className="rounded-md border"
                            disabled={(date) => {
                              if (!selectedVet) return true;
                              const dateStr = format(date, "yyyy-MM-dd");
                              const slots = selectedVet.availableSlots[dateStr];
                              return !slots || slots.length === 0;
                            }}
                          />
                        </div>

                        {/* Time Slot Selection */}
                        {selectedDate && selectedVet && (
                          <div className="space-y-2">
                            <Label>Select Time</Label>
                            <RadioGroup
                              value={selectedTimeSlot}
                              onValueChange={setSelectedTimeSlot}
                              className="grid grid-cols-3 gap-2"
                            >
                              {getAvailableTimeSlots(selectedDate, selectedVet).map((slot) => (
                                <div key={slot} className="flex items-center space-x-2">
                                  <RadioGroupItem value={slot} id={slot} />
                                  <Label htmlFor={slot}>{slot}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}

                        <Button
                          className="w-full"
                          onClick={handleBookAppointment}
                          disabled={
                            bookAppointmentMutation.isPending ||
                            !selectedDate ||
                            !selectedTimeSlot ||
                            !selectedPetId
                          }
                        >
                          {bookAppointmentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            "Confirm Booking"
                          )}
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

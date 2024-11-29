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
import { Star, Phone, MapPin, Award, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function VetDirectoryPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const { data: veterinarians, isLoading, error } = useQuery({
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

  const { data: pets, isLoading: isPetsLoading } = useQuery({
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

  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
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

  const filteredVets = veterinarians?.filter((vet: any) => {
    const matchesSearch = vet.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vet.clinicAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = !specialization || specialization === "all" || vet.specializations.includes(specialization);
    return matchesSearch && matchesSpecialization;
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

    const appointmentDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTimeSlot.split(":");
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

    bookAppointmentMutation.mutate({
      veterinarianId: selectedVet.id,
      petId: parseInt(selectedPetId),
      dateTime: appointmentDateTime.toISOString(),
      type: "consultation",
      status: "scheduled",
      notes: `Appointment with ${selectedVet.user.name}`,
    });
  };

  const getAvailableTimeSlots = (date: Date, vet: any) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return vet.availableSlots[dateStr] || [];
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load veterinarians"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
            <SelectItem value="all">All Specializations</SelectItem>
            <SelectItem value="general">General Practice</SelectItem>
            <SelectItem value="surgery">Surgery</SelectItem>
            <SelectItem value="dermatology">Dermatology</SelectItem>
            <SelectItem value="dentistry">Dentistry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : !veterinarians || veterinarians.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No veterinarians found. Please check back later.
          </AlertDescription>
        </Alert>
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
                                pets.map((pet: any) => (
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
                              const slots = vet.availableSlots[format(date, "yyyy-MM-dd")];
                              return !slots || slots.length === 0;
                            }}
                          />
                        </div>

                        {/* Time Slot Selection */}
                        {selectedDate && (
                          <div className="space-y-2">
                            <Label>Select Time</Label>
                            <RadioGroup
                              value={selectedTimeSlot}
                              onValueChange={setSelectedTimeSlot}
                              className="grid grid-cols-3 gap-2"
                            >
                              {getAvailableTimeSlots(selectedDate, vet).map((slot: string) => (
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

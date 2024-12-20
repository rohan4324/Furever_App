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
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Star, Phone, MapPin, Award, Clock, AlertCircle, Loader2, Search, Filter, Video } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCall } from "@/components/video/VideoCall";

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
  petId: number; //This remains for backward compatibility, though not used in the updated code.
  dateTime: string;
  type: "consultation" | "checkup" | "emergency";
  status: "scheduled";
  notes: string;
}

export default function VetConnectPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [selectedAnimalType, setSelectedAnimalType] = useState<string>("");
  const [selectedVet, setSelectedVet] = useState<VetWithUser | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string>("");
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"consultation" | "checkup" | "emergency">("consultation");

  // Define animal types
  const animalTypes = [
    { id: 1, type: "Dog" },
    { id: 2, type: "Cat" },
    { id: 3, type: "Bird" },
    { id: 4, type: "Fish" },
    { id: 5, type: "Hamster" },
    { id: 6, type: "Rabbit" },
    { id: 7, type: "Guinea Pig" },
    { id: 8, type: "Other" }
  ];

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
      setSelectedAnimalType("");
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
      !specialization || specialization === "all" || vet.specializations.includes(specialization);

    return matchesSearch && matchesSpecialization;
  });

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedAnimalType || !selectedVet) {
      toast({
        title: "Error",
        description: "Please select all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTimeSlot.split(":");
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      bookAppointmentMutation.mutate({
        veterinarianId: selectedVet.id,
        petId: 0, // Placeholder,  petId is no longer used in the logic.
        dateTime: appointmentDateTime.toISOString(),
        type: appointmentType,
        status: "scheduled",
        notes: `${appointmentType.charAt(0).toUpperCase() + appointmentType.slice(1)} with ${selectedVet.user.name}`,
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
      <h1 className="text-4xl font-bold mb-8">Vet Connect</h1>

      <Tabs defaultValue="find-vet" className="mb-8">
        <TabsList>
          <TabsTrigger value="find-vet">Find a Veterinarian</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Services</TabsTrigger>
        </TabsList>

        <TabsContent value="find-vet">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            <div className="relative col-span-1">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger className="pl-9 w-full">
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
          </div>

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
                        <DialogContent className="max-w-[95vw] w-full sm:max-w-md mx-auto">
                          <DialogHeader>
                            <DialogTitle>Book Appointment with {vet.user.name}</DialogTitle>
                            <DialogDescription>
                              Schedule a consultation with Dr. {vet.user.name}. Choose your preferred date, time, and consultation type.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            {/* Pet Type Selection */}
                            <div className="space-y-2">
                              <Label>Select Animal Type</Label>
                              <Select 
                                value={selectedAnimalType} 
                                onValueChange={setSelectedAnimalType}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose animal type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {animalTypes.map((animal) => (
                                    <SelectItem key={animal.id} value={animal.type}>
                                      {animal.type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Appointment Type */}
                            <div className="space-y-2">
                              <Label>Appointment Type</Label>
                              <Select
                                value={appointmentType}
                                onValueChange={(value: "consultation" | "checkup" | "emergency") =>
                                  setAppointmentType(value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="consultation">Consultation</SelectItem>
                                  <SelectItem value="checkup">Check-up</SelectItem>
                                  <SelectItem value="emergency">Emergency</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Date Selection */}
                            <div className="space-y-2">
                              <Label>Select Date</Label>
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border"
                                disabled={(date) => date < new Date()}
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
                                  {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((slot) => (
                                    <div key={slot} className="flex items-center space-x-2">
                                      <RadioGroupItem value={slot} id={slot} />
                                      <Label htmlFor={slot}>{slot}</Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            )}

                            {/* Video Consultation Option */}
                            {appointmentType === "consultation" && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Video className="w-4 h-4" />
                                    <span className="text-sm">Video consultation available</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowVideoCall(true)}
                                  >
                                    Start Video Call
                                  </Button>
                                </div>

                                {showVideoCall && (
                                  <Dialog open={showVideoCall} onOpenChange={setShowVideoCall}>
                                    <DialogContent className="max-w-4xl">
                                      <DialogHeader>
                                        <DialogTitle>Video Consultation</DialogTitle>
                                        <DialogDescription>
                                          Your video consultation with Dr. {selectedVet?.user.name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="aspect-video">
                                        <VideoCall
                                          appointmentId={`temp-${Date.now()}`}
                                          isInitiator={true}
                                          onEnd={() => setShowVideoCall(false)}
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            )}

                            <Button
                              className="w-full"
                              onClick={handleBookAppointment}
                              disabled={
                                bookAppointmentMutation.isPending ||
                                !selectedDate ||
                                !selectedTimeSlot ||
                                !selectedAnimalType
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
        </TabsContent>

        <TabsContent value="emergency">
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Emergency Veterinary Services - Available 24/7</AlertTitle>
              <AlertDescription>
                If your pet requires immediate medical attention, please contact our emergency services immediately.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Hotline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Our emergency hotline is available 24/7 for immediate assistance
                    </p>
                    <Button className="w-full" size="lg" onClick={() => window.location.href = 'tel:1-800-PET-EMRG'}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call 1-800-PET-EMRG
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Emergency Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Central Pet ER", address: "123 Emergency Ave", phone: "555-0123" },
                      { name: "24/7 Pet Care", address: "456 Urgent St", phone: "555-0124" }
                    ].map((location) => (
                      <div key={location.name} className="p-4 border rounded-lg">
                        <h4 className="font-semibold">{location.name}</h4>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto mt-1"
                          onClick={() => window.location.href = `tel:${location.phone}`}
                        >
                          {location.phone}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Emergency Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">When to Seek Emergency Care</h4>
                        <ul className="mt-2 space-y-2 text-sm">
                          <li>• Difficulty breathing</li>
                          <li>• Severe bleeding or trauma</li>
                          <li>• Suspected poisoning</li>
                          <li>• Severe vomiting or diarrhea</li>
                          <li>• Collapse or seizures</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold">What to Do While Waiting</h4>
                        <ul className="mt-2 space-y-2 text-sm">
                          <li>• Keep your pet warm and comfortable</li>
                          <li>• Minimize movement if injury is suspected</li>
                          <li>• Have medical records ready</li>
                          <li>• Follow emergency vet instructions</li>
                          <li>• Stay calm and reassure your pet</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
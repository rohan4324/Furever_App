import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define form schema with enhanced validation
const formSchema = z.object({
  petId: z.number({
    required_error: "Please select a pet",
    invalid_type_error: "Please select a valid pet",
  }),
  type: z.enum(["condition", "medication", "allergy", "surgery", "test_result"], {
    required_error: "Please select a record type",
  }),
  description: z.string()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  date: z.date({
    required_error: "Please select a date",
    invalid_type_error: "Please enter a valid date",
  }),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional(),
  severity: z.enum(["low", "medium", "high"], {
    required_error: "Please select severity level",
  }).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function MedicalHistoryPage() {
  const { toast } = useToast();
  const [selectedPet, setSelectedPet] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "condition",
      description: "",
      date: new Date(),
      attachments: [],
    },
  });

  // Define animal types and state
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

  const [selectedAnimalType, setSelectedAnimalType] = useState<string>("");

  // Fetch health records for selected pet
  const { data: healthRecords, refetch: refetchRecords } = useQuery({
    queryKey: ["health-records", selectedPet],
    enabled: !!selectedPet,
    queryFn: async () => {
      const res = await fetch(`/api/health-records/${selectedPet}`);
      if (!res.ok) throw new Error("Failed to fetch health records");
      return res.json();
    },
  });

  // Add health record mutation
  const addHealthRecordMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/health-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, date: data.date.toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to add health record");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Health record added successfully",
      });
      form.reset();
      refetchRecords();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add health record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (!selectedPet) {
        toast({
          title: "Error",
          description: "Please select a pet",
          variant: "destructive",
        });
        return;
      }

      // Show loading state
      toast({
        title: "Adding record",
        description: "Please wait while we save your medical record...",
      });

      await addHealthRecordMutation.mutateAsync({ ...data, petId: selectedPet });
      
      // Reset form and show success message
      form.reset();
      toast({
        title: "Success",
        description: "Medical record added successfully",
      });
      
      // Refresh the records list
      await refetchRecords();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add medical record",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (record: any) => {
    try {
      // Create a QR code for the record
      const qrCode = await fetch("/api/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId: record.id,
          animalType: selectedAnimalType,
          recordType: record.type,
          date: record.date,
          description: record.description,
        }),
      });

      if (!qrCode.ok) {
        throw new Error("Failed to generate QR code");
      }

      const { qrUrl, shareableLink } = await qrCode.json();

      // Create a formatted medical record for sharing
      const recordText = `
Pet Medical Record
Type: ${record.type}
Animal: ${selectedAnimalType}
Date: ${new Date(record.date).toLocaleDateString()}
Description: ${record.description}
Shareable Link: ${shareableLink}
      `.trim();

      await navigator.clipboard.writeText(recordText);
      
      toast({
        title: "Success",
        description: "Medical record copied to clipboard. QR code generated for easy sharing.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to share medical record",
        variant: "destructive",
      });
    }
    setShareDialogOpen(false);
  };

  const recordTypeOptions = [
    { value: "condition", label: "Medical Condition" },
    { value: "medication", label: "Medication" },
    { value: "allergy", label: "Allergy" },
    { value: "surgery", label: "Surgery" },
    { value: "test_result", label: "Test Result" },
  ];

  

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Pet Medical History</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Medical Record Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Medical Record</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="petId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Pet</FormLabel>
                      <Select
                        value={selectedPet?.toString()}
                        onValueChange={(value) => setSelectedPet(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a pet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {animalTypes.map((animal) => (
                            <SelectItem key={animal.id} value={animal.id.toString()}>
                              {animal.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Record Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select record type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recordTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addHealthRecordMutation.isPending}
                >
                  {addHealthRecordMutation.isPending ? "Adding..." : "Add Medical Record"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Medical History Display */}
        <Card>
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPet ? (
              <p className="text-muted-foreground">Select a pet to view medical history</p>
            ) : !healthRecords || healthRecords.length === 0 ? (
              <p className="text-muted-foreground">No medical records found</p>
            ) : (
              <div className="space-y-4">
                {healthRecords.map((record: any) => (
                  <div
                    key={record.id}
                    className="p-4 border rounded-lg space-y-2 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold capitalize">{record.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(record)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                    <p className="text-sm">{record.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

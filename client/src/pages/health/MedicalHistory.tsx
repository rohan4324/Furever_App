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
import { insertHealthRecordSchema, type InsertHealthRecord } from "@db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = insertHealthRecordSchema;

export default function MedicalHistoryPage() {
  const { toast } = useToast();
  const [selectedPet, setSelectedPet] = useState<number | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "condition",
      description: "",
      date: new Date(),
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

  const { data: healthRecords, refetch: refetchRecords } = useQuery({
    queryKey: ["health-records", selectedPet],
    enabled: !!selectedPet,
    queryFn: async () => {
      const res = await fetch(`/api/health-records/${selectedPet}`);
      if (!res.ok) throw new Error("Failed to fetch health records");
      return res.json();
    },
  });

  const addHealthRecordMutation = useMutation({
    mutationFn: async (data: InsertHealthRecord) => {
      const res = await fetch("/api/health-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!selectedPet) {
      toast({
        title: "Error",
        description: "Please select a pet",
        variant: "destructive",
      });
      return;
    }
    addHealthRecordMutation.mutate({ ...data, petId: selectedPet });
  };

  const handleShare = async (record: any) => {
    // Copy record details to clipboard
    const recordText = `
Pet Medical Record
Type: ${record.type}
Date: ${new Date(record.date).toLocaleDateString()}
Description: ${record.description}
    `.trim();

    try {
      await navigator.clipboard.writeText(recordText);
      toast({
        title: "Success",
        description: "Medical record copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy record to clipboard",
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
                          {pets?.map((pet: any) => (
                            <SelectItem key={pet.id} value={pet.id.toString()}>
                              {pet.name}
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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

                <Button type="submit" className="w-full">
                  Add Medical Record
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPet ? (
              <p className="text-muted-foreground">Select a pet to view medical history</p>
            ) : healthRecords?.length === 0 ? (
              <p className="text-muted-foreground">No medical records found</p>
            ) : (
              <div className="space-y-4">
                {healthRecords?.map((record: any) => (
                  <div
                    key={record.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold capitalize">{record.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                          >
                            Share
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Share Medical Record</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Share this medical record with veterinarians or other pet care professionals.</p>
                            <Button
                              className="w-full"
                              onClick={() => handleShare(selectedRecord)}
                            >
                              Copy to Clipboard
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVaccinationSchema, type InsertVaccination } from "@db/schema";

const formSchema = insertVaccinationSchema;

export default function VaccinationPage() {
  const { toast } = useToast();
  const [selectedPet, setSelectedPet] = useState<number | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      notes: "",
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

  const { data: vaccinations } = useQuery({
    queryKey: ["vaccinations", selectedPet],
    enabled: !!selectedPet,
    queryFn: async () => {
      const res = await fetch(`/api/vaccinations/${selectedPet}`);
      if (!res.ok) throw new Error("Failed to fetch vaccinations");
      return res.json();
    },
  });

  const addVaccinationMutation = useMutation({
    mutationFn: async (data: InsertVaccination) => {
      const res = await fetch("/api/vaccinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add vaccination");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vaccination record added successfully",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add vaccination",
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
    addVaccinationMutation.mutate({ ...data, petId: selectedPet });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Vaccination Schedule</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Vaccination Record</CardTitle>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaccination Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vaccination Date</FormLabel>
                      <FormControl>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Add Vaccination Record
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vaccination History</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPet ? (
              <p className="text-muted-foreground">Select a pet to view vaccination history</p>
            ) : vaccinations?.length === 0 ? (
              <p className="text-muted-foreground">No vaccination records found</p>
            ) : (
              <div className="space-y-4">
                {vaccinations?.map((vaccination: any) => (
                  <div
                    key={vaccination.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <h3 className="font-semibold">{vaccination.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Date: {new Date(vaccination.date).toLocaleDateString()}
                    </p>
                    {vaccination.nextDueDate && (
                      <p className="text-sm text-muted-foreground">
                        Next Due: {new Date(vaccination.nextDueDate).toLocaleDateString()}
                      </p>
                    )}
                    {vaccination.notes && (
                      <p className="text-sm">{vaccination.notes}</p>
                    )}
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

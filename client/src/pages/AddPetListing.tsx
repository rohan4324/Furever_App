import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPetSchema } from "@db/schema"; // Ensure this imports the correct schema
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type SimplifiedInsertPet = {
  name: string;
  type: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  gender: string;
  size: string;
  description: string;
  images: string[];
  status: string;
  city: string; // Ensure 'city' property is included
};

export default function AddPetListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<FileList | undefined>(undefined); // Changed to `undefined`

  const form = useForm<SimplifiedInsertPet>({
    resolver: zodResolver(insertPetSchema),
    defaultValues: {
      name: "",
      type: "dog",
      breed: "",
      ageYears: 0,
      ageMonths: 0,
      gender: "male",
      size: "medium",
      description: "",
      images: [],
      status: "available",
      city: "", // Default value for city
    },
  });

  const mutation = useMutation({
    mutationFn: async (
      data: SimplifiedInsertPet & { imageFiles?: FileList },
    ) => {
      const formData = new FormData();
      if (data.imageFiles && data.imageFiles instanceof FileList) {
        for (let i = 0; i < data.imageFiles.length; i++) {
          const file = data.imageFiles.item(i);
          if (file) {
            formData.append("images", file);
          }
        }
      }
      const { imageFiles, ...petData } = data;
      formData.append("data", JSON.stringify(petData));

      const res = await fetch("/api/pets", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create pet listing");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pet listing created successfully",
      });
      navigate("/pets");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pet listing",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SimplifiedInsertPet) => {
    mutation.mutate({ ...data, imageFiles: images });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Add Pet Listing</h1>
        <p className="text-lg text-muted-foreground">
          Fill out the form below to create a new pet listing.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Pet Name</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label>City</Label>
            <Input {...form.register("city")} placeholder="Enter city" />
            {form.formState.errors.city && (
              <p className="text-sm text-destructive">
                {form.formState.errors.city.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select
                onValueChange={(value) => form.setValue("type", value as any)}
                defaultValue={form.getValues("type")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="hamster">Hamster</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="guinea_pig">Guinea Pig</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Breed</Label>
              <Input {...form.register("breed")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age (Years)</Label>
              <Input
                type="number"
                min="0"
                {...form.register("ageYears", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label>Age (Months)</Label>
              <Input
                type="number"
                min="0"
                max="11"
                {...form.register("ageMonths", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gender</Label>
              <Select
                onValueChange={(value) => form.setValue("gender", value as any)}
                defaultValue={form.getValues("gender")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Size</Label>
              <Select
                onValueChange={(value) => form.setValue("size", value as any)}
                defaultValue={form.getValues("size")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea {...form.register("description")} />
          </div>

          <div>
            <Label>Images</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setImages(e.target.files ? e.target.files : undefined)
              }
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/pets")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}

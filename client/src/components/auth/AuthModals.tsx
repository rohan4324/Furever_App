import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { insertUserSchema, type InsertUser } from "@db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuthModalsProps {
  type: "login" | "register";
  onClose: () => void;
}

export default function AuthModals({ type, onClose }: AuthModalsProps) {
  const { toast } = useToast();
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      type: "adopter",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(`/api/auth/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Authentication failed");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: type === "login" ? "Welcome back!" : "Account created!",
        description: "You have been successfully authenticated.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {type === "login" ? "Welcome Back" : "Create Account"}
        </DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          {type === "register" && (
            <div className="space-y-2">
              <label>Name</label>
              <Input {...form.register("name")} />
            </div>
          )}

          <div className="space-y-2">
            <label>Email</label>
            <Input type="email" {...form.register("email")} />
          </div>

          <div className="space-y-2">
            <label>Password</label>
            <Input type="password" {...form.register("password")} />
          </div>

          {type === "register" && (
            <div className="space-y-2">
              <label>Account Type</label>
              <select {...form.register("type")} className="w-full p-2 border rounded">
                <option value="adopter">Adopter</option>
                <option value="shelter">Shelter/NGO</option>
              </select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Loading..." : type === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

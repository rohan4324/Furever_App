import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { insertMessageSchema } from "@db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatBoxProps {
  recipientId: number;
  petId?: number;
  onClose: () => void;
}

export default function ChatBox({ recipientId, petId, onClose }: ChatBoxProps) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: {
      content: "",
      toUserId: recipientId,
    },
  });

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", recipientId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?recipientId=${recipientId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: { content: string; toUserId: number }) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      form.reset();
      refetch();
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Send Message</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <ScrollArea className="h-[300px] p-4 border rounded-lg">
          {messages?.map((msg: any) => (
            <div
              key={msg.id}
              className={`mb-4 ${
                msg.fromUserId === recipientId ? "text-left" : "text-right"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.fromUserId === recipientId
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </ScrollArea>

        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <Textarea
            placeholder="Type your message here..."
            {...form.register("content")}
          />
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </div>
    </DialogContent>
  );
}

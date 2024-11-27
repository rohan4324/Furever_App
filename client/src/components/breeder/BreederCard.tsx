import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Breeder, User } from "@db/schema";
import ChatBox from "../messaging/ChatBox";
import { useState } from "react";

interface BreederCardProps {
  breeder: Breeder & { user: User };
}

export default function BreederCard({ breeder }: BreederCardProps) {
  const [showChat, setShowChat] = useState(false);
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${breeder.user?.name ?? 'Unknown Breeder'}`}
            alt={breeder.user?.name ?? 'Unknown Breeder'}
            className="w-24 h-24 rounded-lg object-cover"
          />
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{breeder.user?.name ?? 'Unknown Breeder'}</h3>
              {breeder.verificationStatus && (
                <Badge variant="secondary">Verified Breeder</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {breeder.description}
            </p>

            <div className="space-y-1 text-sm mb-4">
              <p>
                <strong>Specializations:</strong> {breeder.specializations.join(", ")}
              </p>
              <p>
                <strong>Address:</strong> {breeder.address}
              </p>
              <p>
                <strong>Phone:</strong> {breeder.phone}
              </p>
              {breeder.website && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={breeder.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {breeder.website}
                  </a>
                </p>
              )}
            </div>

            <Dialog open={showChat} onOpenChange={setShowChat}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Contact Breeder
                </Button>
              </DialogTrigger>
              <ChatBox
                recipientId={breeder.userId}
                onClose={() => setShowChat(false)}
              />
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

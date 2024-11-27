import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Shelter, User } from "@db/schema";
import ChatBox from "../messaging/ChatBox";
import { useState } from "react";

interface ShelterCardProps {
  shelter: Shelter & { user: User };
}

export default function ShelterCard({ shelter }: ShelterCardProps) {
  const [showChat, setShowChat] = useState(false);
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${shelter.user?.name || 'Unknown Shelter'}`}
            alt={shelter.user?.name || 'Unknown Shelter'}
            className="w-24 h-24 rounded-lg object-cover"
          />
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{shelter.user?.name || 'Unknown Shelter'}</h3>
              {shelter.verificationStatus && (
                <Badge variant="secondary">Verified</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {shelter.description}
            </p>

            <div className="space-y-1 text-sm mb-4">
              <p>
                <strong>Address:</strong> {shelter.address}
              </p>
              <p>
                <strong>Phone:</strong> {shelter.phone}
              </p>
              {shelter.website && (
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href={shelter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {shelter.website}
                  </a>
                </p>
              )}
            </div>

            <Dialog open={showChat} onOpenChange={setShowChat}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Contact Shelter
                </Button>
              </DialogTrigger>
              <ChatBox
                recipientId={shelter.userId}
                onClose={() => setShowChat(false)}
              />
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Pet } from "@db/schema";
import ChatBox from "../messaging/ChatBox";
import { useState } from "react";

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const [showChat, setShowChat] = useState(false);

  const age = pet.age as { years: number; months: number };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square overflow-hidden">
        <img
          src={pet.images[0]}
          alt={pet.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-semibold">{pet.name}</h3>
          <Badge variant={pet.status === "available" ? "secondary" : "outline"}>
            {pet.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Breed:</strong> {pet.breed}
          </p>
          <p>
            <strong>Age:</strong>{' '}
            {age.years > 0
              ? `${age.years} year${age.years !== 1 ? 's' : ''}`
              : ''
            }
            {age.years > 0 && age.months > 0 ? ' and ' : ''}
            {age.months > 0
              ? `${age.months} month${age.months !== 1 ? 's' : ''}`
              : age.years === 0 ? '< 1 month' : ''
            }
          </p>
          <p>
            <strong>Size:</strong> {pet.size}
          </p>
          <p>
            <strong>Gender:</strong> {pet.gender}
          </p>
        </div>

        <p className="mt-4 line-clamp-3">{pet.description}</p>
      </CardContent>

      <CardFooter className="p-6 pt-0 space-x-4">
        <Dialog open={showChat} onOpenChange={setShowChat}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1">
              Contact {pet.breeder ? "Breeder" : "Shelter"}
            </Button>
          </DialogTrigger>
          <ChatBox
            recipientId={pet.shelterId}
            petId={pet.id}
            onClose={() => setShowChat(false)}
          />
        </Dialog>
        
        <Button className="flex-1">Adopt Now</Button>
      </CardFooter>
    </Card>
  );
}

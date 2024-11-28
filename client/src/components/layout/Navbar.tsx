import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import AuthModals from "../auth/AuthModals";

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();

  return (
    <div className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          <span className="font-['Pacifico'] text-3xl" style={{
            background: 'linear-gradient(45deg, hsl(16, 90%, 50%), hsl(25, 95%, 53%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '1px'
          }}>
            FurEver
          </span>
          <span className="ml-2 text-xl font-normal text-foreground">Home</span>
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={`${navigationMenuTriggerStyle()} hover:bg-primary hover:text-primary-foreground`}
                onClick={() => setLocation("/pets")}
              >
                Find Pets
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={`${navigationMenuTriggerStyle()} hover:bg-primary hover:text-primary-foreground`}
                onClick={() => setLocation("/shelters")}
              >
                Shelters
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={`${navigationMenuTriggerStyle()} hover:bg-primary hover:text-primary-foreground`}
                onClick={() => setLocation("/breeders")}
              >
                Breeders
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={`${navigationMenuTriggerStyle()} hover:bg-primary hover:text-primary-foreground`}
                onClick={() => setLocation("/quiz")}
              >
                Compatibility Quiz
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setAuthType("login");
              setShowAuth(true);
            }}
          >
            Sign In
          </Button>
          <Button
            onClick={() => {
              setAuthType("register");
              setShowAuth(true);
            }}
          >
            Get Started
          </Button>
        </div>

        <Dialog open={showAuth} onOpenChange={setShowAuth}>
          <AuthModals type={authType} onClose={() => setShowAuth(false)} />
        </Dialog>
      </div>
    </div>
  );
}

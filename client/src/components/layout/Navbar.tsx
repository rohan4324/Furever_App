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
        <Link href="/" className="text-2xl font-bold text-primary flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12,2C6.47,2 2,6.47 2,12s4.47,10 10,10 10-4.47 10-10S17.53,2 12,2z"/>
            <path d="M9,9c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S9,7.9,9,9z"/>
            <path d="M19,9c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S19,7.9,19,9z"/>
            <path d="M12,17.5c2.33,0 4.31-1.46 5.11-3.5H6.89c0.8,2.04 2.78,3.5 5.11,3.5z"/>
          </svg>
          FurEver
        </Link>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={navigationMenuTriggerStyle()}
                onClick={() => setLocation("/pets")}
              >
                Find Pets
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={navigationMenuTriggerStyle()}
                onClick={() => setLocation("/shelters")}
              >
                Shelters
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={navigationMenuTriggerStyle()}
                onClick={() => setLocation("/breeders")}
              >
                Breeders
              </Button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                variant="ghost"
                className={navigationMenuTriggerStyle()}
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

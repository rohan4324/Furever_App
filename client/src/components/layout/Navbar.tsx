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
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12,2C6.47,2,2,6.47,2,12c0,5.53,4.47,10,10,10s10-4.47,10-10C22,6.47,17.53,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z"/>
            <path d="M8.5,7C7.67,7,7,7.67,7,8.5S7.67,10,8.5,10S10,9.33,10,8.5S9.33,7,8.5,7z"/>
            <path d="M15.5,7C14.67,7,14,7.67,14,8.5s0.67,1.5,1.5,1.5S17,9.33,17,8.5S16.33,7,15.5,7z"/>
            <path d="M12,14c-2.33,0-4.31,1.46-5.11,3.5h10.22C16.31,15.46,14.33,14,12,14z"/>
            <path d="M7.5,6C6.67,6,6,5.33,6,4.5S6.67,3,7.5,3S9,3.67,9,4.5S8.33,6,7.5,6z"/>
            <path d="M16.5,6C15.67,6,15,5.33,15,4.5S15.67,3,16.5,3S18,3.67,18,4.5S17.33,6,16.5,6z"/>
          </svg>
          <span className="ml-2 text-xl font-bold">FurEver Home</span>
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

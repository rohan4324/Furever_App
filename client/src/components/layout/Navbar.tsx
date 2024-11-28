import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuContent,
  NavigationMenuTrigger,
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
              <NavigationMenuTrigger className="hover:bg-primary hover:text-primary-foreground">
                Pet Adoption
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuList className="grid w-[400px] gap-3 p-4">
                  <NavigationMenuItem onClick={() => setLocation("/pets")}>
                    <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div className="text-sm font-medium leading-none">Find Pets</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Browse available pets for adoption
                      </p>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem onClick={() => setLocation("/shelters")}>
                    <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div className="text-sm font-medium leading-none">Shelters</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Find local animal shelters and NGOs
                      </p>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem onClick={() => setLocation("/breeders")}>
                    <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div className="text-sm font-medium leading-none">Breeders</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Connect with professional pet breeders
                      </p>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem onClick={() => setLocation("/quiz")}>
                    <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div className="text-sm font-medium leading-none">Compatibility Quiz</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        Find your perfect pet match
                      </p>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem onClick={() => setLocation("/add-pet")}>
                    <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div className="text-sm font-medium leading-none">Add Pet Listing</div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        List your pet for adoption or sale
                      </p>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenuContent>
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

import { Button } from "@/components/ui/button";
// No navigation menu imports needed
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import AuthModals from "../auth/AuthModals";

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

        <div 
          className="dropdown-container"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <div className={`dropdown-trigger ${isDropdownOpen ? 'active' : ''}`}>
            Pet Adoption
          </div>
          <div className={`dropdown-content ${isDropdownOpen ? 'open' : ''}`}>
            <div className="dropdown-item" onClick={() => setLocation("/pets")}>
              <div className="font-medium">Find Pets</div>
              <p className="text-sm text-muted-foreground">Browse available pets for adoption</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/shelters")}>
              <div className="font-medium">Shelters</div>
              <p className="text-sm text-muted-foreground">Find local animal shelters and NGOs</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/breeders")}>
              <div className="font-medium">Breeders</div>
              <p className="text-sm text-muted-foreground">Connect with professional pet breeders</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/quiz")}>
              <div className="font-medium">Compatibility Quiz</div>
              <p className="text-sm text-muted-foreground">Find your perfect pet match</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/add-pet")}>
              <div className="font-medium">Add Pet Listing</div>
              <p className="text-sm text-muted-foreground">List your pet for adoption or sale</p>
            </div>
          </div>
        </div>

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

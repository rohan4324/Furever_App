import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import AuthModals from "../auth/AuthModals";

export default function Navbar() {
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pawsShopOpen, setPawsShopOpen] = useState(false);
  const [furstStepsOpen, setFurstStepsOpen] = useState(false);
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

        <div 
          className="dropdown-container"
          onMouseEnter={() => setPawsShopOpen(true)}
          onMouseLeave={() => setPawsShopOpen(false)}
        >
          <div className={`dropdown-trigger ${pawsShopOpen ? 'active' : ''}`}>
            Paws & Shop
          </div>
          <div className={`dropdown-content ${pawsShopOpen ? 'open' : ''}`}>
            <div className="dropdown-item" onClick={() => setLocation("/shop/food")}>
              <div className="font-medium">Food & Nutrition</div>
              <p className="text-sm text-muted-foreground">Premium pet food, specialty diets, and supplements</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/shop/accessories")}>
              <div className="font-medium">Accessories</div>
              <p className="text-sm text-muted-foreground">Collars, leashes, beds, crates, and feeding supplies</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/shop/grooming")}>
              <div className="font-medium">Grooming Supplies</div>
              <p className="text-sm text-muted-foreground">Shampoos, brushes, and dental care products</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/shop/training")}>
              <div className="font-medium">Training Aids</div>
              <p className="text-sm text-muted-foreground">Clickers, treat bags, and training pads</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/shop/safety")}>
              <div className="font-medium">Safety Products</div>
              <p className="text-sm text-muted-foreground">GPS trackers, ID tags, and pet-proofing items</p>
            </div>
          </div>
        </div>

        <div 
          className="dropdown-container"
          onMouseEnter={() => setFurstStepsOpen(true)}
          onMouseLeave={() => setFurstStepsOpen(false)}
        >
          <div className={`dropdown-trigger ${furstStepsOpen ? 'active' : ''}`}>
            Furst Steps
          </div>
          <div className={`dropdown-content ${furstStepsOpen ? 'open' : ''}`}>
            <div className="dropdown-item" onClick={() => setLocation("/guides")}>
              <div className="font-medium">Pet Care Guides</div>
              <p className="text-sm text-muted-foreground">Essential tips for new pet parents</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/health/vaccination")}>
              <div className="font-medium">Vaccination Schedule</div>
              <p className="text-sm text-muted-foreground">Track and manage pet vaccinations</p>
            </div>
            
            <div className="dropdown-item" onClick={() => setLocation("/health/medical-history")}>
              <div className="font-medium">Medical History</div>
              <p className="text-sm text-muted-foreground">Track and manage pet medical records</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/vet-connect")}>
              <div className="font-medium">Vet Connect</div>
              <p className="text-sm text-muted-foreground">Find veterinarians near you</p>
            </div>
            <div className="dropdown-item" onClick={() => setLocation("/insurance")}>
              <div className="font-medium">Pet Insurance</div>
              <p className="text-sm text-muted-foreground">Compare and manage pet insurance plans</p>
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

import { Globe2, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
];

export function Footer() {
  const [, navigate] = useLocation();
  const [currentLang, setCurrentLang] = useState("en");

  return (
    <footer className="bg-background border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <button 
                onClick={() => navigate("/about")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                About Us
              </button>
              <button 
                onClick={() => navigate("/support")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Contact Support
              </button>
              <button 
                onClick={() => navigate("/privacy")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => navigate("/terms")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => navigate("/help")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Help Center
              </button>
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Our Services</h3>
            <nav className="flex flex-col space-y-2">
              <button 
                onClick={() => navigate("/pets")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Pet Adoption
              </button>
              <button 
                onClick={() => navigate("/shop/food")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Pet Supplies
              </button>
              <button 
                onClick={() => navigate("/health/vet-connect")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Veterinary Services
              </button>
              <button 
                onClick={() => navigate("/insurance")}
                className="text-muted-foreground hover:text-primary text-left"
              >
                Pet Insurance
              </button>
            </nav>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Connect With Us</h3>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Language</h3>
            <div className="flex items-center space-x-2">
              <Globe2 className="h-4 w-4" />
              <Select value={currentLang} onValueChange={setCurrentLang}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} FurEver Friends. All rights reserved.</p>
          <p className="mt-2">Made with ❤️ for pets and their humans</p>
        </div>
      </div>
    </footer>
  );
}

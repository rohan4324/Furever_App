import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function HomePage() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1673090586803-e146697186ba"
          alt="Happy pets"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center p-6">
          <h1 className="text-5xl font-bold mb-4">Find Your FurEver Friend</h1>
          <p className="text-xl mb-8 max-w-2xl">
            Connect with local shelters and NGOs to find your perfect companion
          </p>
          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => navigate("/pets")}
              className="bg-primary hover:bg-primary/90"
            >
              Browse Pets
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/quiz")}
              className="bg-white/10 hover:bg-white/20 border-white"
            >
              Take Compatibility Quiz
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Sections */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <img
              src="https://images.unsplash.com/photo-1604606363386-dd3f2357ad87"
              alt="Animal shelter"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h2 className="text-2xl font-semibold mb-2">Partner Shelters</h2>
            <p className="text-muted-foreground">
              We work with verified shelters and NGOs to ensure the best care for our animals.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <img
              src="https://images.unsplash.com/photo-1542108226-9130e1e83cc4"
              alt="Pet adoption"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h2 className="text-2xl font-semibold mb-2">Easy Adoption Process</h2>
            <p className="text-muted-foreground">
              Our streamlined process makes it simple to find and adopt your new family member.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <img
              src="https://images.unsplash.com/photo-1534361960057-19889db9621e"
              alt="Happy dog"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h2 className="text-2xl font-semibold mb-2">Success Stories</h2>
            <p className="text-muted-foreground">
              Join countless happy families who found their perfect match through FurEver.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

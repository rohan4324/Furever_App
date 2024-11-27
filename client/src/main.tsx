import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import PetListings from "./pages/PetListings";
import Shelters from "./pages/Shelters";
import Breeders from "./pages/Breeders";
import CompatibilityQuiz from "./pages/CompatibilityQuiz";
import Navbar from "./components/layout/Navbar";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/pets" component={PetListings} />
          <Route path="/shelters" component={Shelters} />
          <Route path="/breeders" component={Breeders} />
          <Route path="/quiz" component={CompatibilityQuiz} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  </StrictMode>,
);

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
import AddPetListing from "./pages/AddPetListing";
import ShopCategory from "./pages/ShopCategory";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Navbar from "./components/layout/Navbar";
import Vaccination from "./pages/health/Vaccination";
import VetConnect from "./pages/health/VetConnect";
import CheckUps from "./pages/health/CheckUps";
import PetCareGuides from "./pages/guides/PetCareGuides";
import Insurance from "./pages/insurance/Insurance";

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
          <Route path="/add-pet" component={AddPetListing} />
          <Route path="/shop/:category" component={ShopCategory} />
          <Route path="/shop/product/:id" component={ProductDetails} />
          <Route path="/cart" component={Cart} />
          <Route path="/health/vaccination" component={Vaccination} />
          <Route path="/vet-connect" component={VetConnect} />
          <Route path="/health/checkups" component={CheckUps} />
          <Route path="/guides" component={PetCareGuides} />
          <Route path="/insurance" component={Insurance} />
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

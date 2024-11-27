import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PetFiltersProps {
  onFilterChange: (filters: Record<string, string>) => void;
}

export default function PetFilters({ onFilterChange }: PetFiltersProps) {
  const handleFilterChange = (key: string, value: string | null) => {
    onFilterChange({ [key]: value || "" });
  };

  const handleReset = () => {
    // Reset all select components to show placeholders
    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      select.value = '';
    });
    
    // Update filter state with undefined values
    onFilterChange({
      type: undefined,
      breed: undefined,
      size: undefined,
      ageYears: undefined,
      ageMonths: undefined,
      gender: undefined
    });
  };

  return (
    <Card className="relative">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-medium">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleReset}
          >
            <X className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select onValueChange={(value) => handleFilterChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog">Dogs</SelectItem>
                <SelectItem value="cat">Cats</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select onValueChange={(value) => handleFilterChange("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Any gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Size</Label>
            <Select onValueChange={(value) => handleFilterChange("size", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Age Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Years</Label>
                <Select onValueChange={(value) => handleFilterChange("ageYears", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Under 1</SelectItem>
                    <SelectItem value="1">1-2</SelectItem>
                    <SelectItem value="3">3-5</SelectItem>
                    <SelectItem value="6">6+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Months</Label>
                <Select onValueChange={(value) => handleFilterChange("ageMonths", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0-3</SelectItem>
                    <SelectItem value="4">4-6</SelectItem>
                    <SelectItem value="7">7-9</SelectItem>
                    <SelectItem value="10">10-12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

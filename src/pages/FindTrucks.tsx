import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import TruckCard from "@/components/TruckCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, SlidersHorizontal } from "lucide-react";
import { mockTrucks } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const FindTrucks = () => {
  const [searchLocation, setSearchLocation] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const filteredTrucks = mockTrucks.filter(truck => {
    const matchesLocation = !searchLocation || truck.location.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesEquipment = equipmentFilter === "all" || truck.equipmentType === equipmentFilter;
    
    return matchesLocation && matchesEquipment;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Available Trucks</h1>
          <p className="text-muted-foreground">Search for carriers ready to move your freight</p>
        </div>

        {/* Search Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Search Filters</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="City, State"
                    className="pl-9"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment Type</Label>
                <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
                  <SelectTrigger id="equipment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Dry Van">Dry Van</SelectItem>
                    <SelectItem value="Flatbed">Flatbed</SelectItem>
                    <SelectItem value="Reefer">Reefer</SelectItem>
                    <SelectItem value="Step Deck">Step Deck</SelectItem>
                    <SelectItem value="Tanker">Tanker</SelectItem>
                    <SelectItem value="Box Truck">Box Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrucks.map((truck) => (
            <TruckCard key={truck.id} truck={truck} isAuthenticated={!!user} />
          ))}
        </div>

        {filteredTrucks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No trucks match your search criteria</p>
            <p className="text-muted-foreground mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindTrucks;

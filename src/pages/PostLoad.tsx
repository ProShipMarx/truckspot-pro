import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package } from "lucide-react";
import { z } from "zod";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { LoadMapWithRoute } from "@/components/LoadMapWithRoute";

const loadFormSchema = z.object({
  origin: z.string().trim().min(1, "Origin is required").max(100, "Origin must be less than 100 characters"),
  destination: z.string().trim().min(1, "Destination is required").max(100, "Destination must be less than 100 characters"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  weight: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 80000), {
    message: "Weight must be a positive number up to 80,000 lbs"
  }),
  equipmentType: z.string().min(1, "Equipment type is required"),
  rate: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0), {
    message: "Rate must be a positive number"
  }),
  distance: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 10000), {
    message: "Distance must be a positive number up to 10,000 miles"
  }),
  contactName: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  contactPhone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().refine((val) => !val || /^[\d\s\-\(\)\+]+$/.test(val), {
    message: "Phone number contains invalid characters"
  }),
  contactEmail: z.string().trim().max(255, "Email must be less than 255 characters").optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid email address"
  }),
});

const PostLoad = () => {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useGoogleMaps();
  const { userRole, loading } = useApprovalStatus();

  useEffect(() => {
    if (!loading) {
      if (userRole !== "shipper") {
        toast.error("Only shippers can post loads");
        navigate("/");
      }
    }
  }, [navigate, userRole, loading]);

  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    pickupDate: "",
    weight: "",
    equipmentType: "",
    rate: "",
    distance: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const [originCoords, setOriginCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<google.maps.LatLngLiteral | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with zod schema
    const validation = loadFormSchema.safeParse(formData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to post a load");
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("loads").insert({
      user_id: user.id,
      origin: formData.origin,
      destination: formData.destination,
      origin_lat: originCoords?.lat,
      origin_lng: originCoords?.lng,
      destination_lat: destinationCoords?.lat,
      destination_lng: destinationCoords?.lng,
      pickup_date: formData.pickupDate,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      equipment_type: formData.equipmentType,
      rate: formData.rate ? parseFloat(formData.rate) : null,
      distance: formData.distance ? parseFloat(formData.distance) : null,
      contact_name: formData.contactName || null,
      contact_phone: formData.contactPhone || null,
      contact_email: formData.contactEmail || null,
    });

    if (error) {
      console.error("Error posting load:", error);
      toast.error("Failed to post load. Please try again.");
      return;
    }

    toast.success("Load posted successfully!");
    navigate("/find-loads");
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOriginChange = (value: string, place: google.maps.places.PlaceResult | null) => {
    setFormData(prev => ({ ...prev, origin: value }));
    if (place?.geometry?.location) {
      setOriginCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleDestinationChange = (value: string, place: google.maps.places.PlaceResult | null) => {
    setFormData(prev => ({ ...prev, destination: value }));
    if (place?.geometry?.location) {
      setDestinationCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleDistanceCalculated = (distanceInMiles: number) => {
    setFormData(prev => ({ ...prev, distance: distanceInMiles.toString() }));
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Post a Load</h1>
              <p className="text-muted-foreground">Share your freight details with available carriers</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Load Details</CardTitle>
            <CardDescription>Fill in the information about your freight shipment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin City, State *</Label>
                  <PlacesAutocomplete
                    id="origin"
                    value={formData.origin}
                    onChange={handleOriginChange}
                    placeholder="e.g., Chicago, IL"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination City, State *</Label>
                  <PlacesAutocomplete
                    id="destination"
                    value={formData.destination}
                    onChange={handleDestinationChange}
                    placeholder="e.g., Dallas, TX"
                    required
                  />
                </div>
              </div>

              {/* Map Display */}
              <div className="space-y-2">
                <Label>Route Visualization</Label>
                <div className="border rounded-lg overflow-hidden">
                  <LoadMapWithRoute
                    origin={originCoords}
                    destination={destinationCoords}
                    onDistanceCalculated={handleDistanceCalculated}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupDate">Pickup Date *</Label>
                  <Input
                    id="pickupDate"
                    type="date"
                    value={formData.pickupDate}
                    onChange={(e) => handleChange("pickupDate", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="45000"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (miles)</Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="Calculated from map"
                    value={formData.distance}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipmentType">Equipment Type *</Label>
                  <Select value={formData.equipmentType} onValueChange={(value) => handleChange("equipmentType", value)}>
                    <SelectTrigger id="equipmentType">
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dry Van">Dry Van</SelectItem>
                      <SelectItem value="Flatbed">Flatbed</SelectItem>
                      <SelectItem value="Reefer">Reefer</SelectItem>
                      <SelectItem value="Step Deck">Step Deck</SelectItem>
                      <SelectItem value="Tanker">Tanker</SelectItem>
                      <SelectItem value="Box Truck">Box Truck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    placeholder="2500"
                    value={formData.rate}
                    onChange={(e) => handleChange("rate", e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      placeholder="John Doe"
                      value={formData.contactName}
                      onChange={(e) => handleChange("contactName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange("contactPhone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange("contactEmail", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" size="lg" className="flex-1">
                  Post Load
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostLoad;

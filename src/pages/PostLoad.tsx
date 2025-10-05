import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package } from "lucide-react";

const PostLoad = () => {
  const navigate = useNavigate();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.origin || !formData.destination || !formData.pickupDate || !formData.equipmentType) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("Load posted successfully!");
    navigate("/find-loads");
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
                  <Input
                    id="origin"
                    placeholder="e.g., Chicago, IL"
                    value={formData.origin}
                    onChange={(e) => handleChange("origin", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination City, State *</Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Dallas, TX"
                    value={formData.destination}
                    onChange={(e) => handleChange("destination", e.target.value)}
                    required
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
                    placeholder="850"
                    value={formData.distance}
                    onChange={(e) => handleChange("distance", e.target.value)}
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

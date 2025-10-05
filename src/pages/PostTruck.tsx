import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Truck } from "lucide-react";

const PostTruck = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    location: "",
    equipmentType: "",
    availableDate: "",
    radius: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location || !formData.equipmentType || !formData.availableDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("Truck posted successfully!");
    navigate("/find-trucks");
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
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Post Your Truck</h1>
              <p className="text-muted-foreground">Let brokers know your equipment is available</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Truck Details</CardTitle>
            <CardDescription>Provide information about your available equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Current Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Atlanta, GA"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radius">Search Radius (miles)</Label>
                  <Input
                    id="radius"
                    type="number"
                    placeholder="250"
                    value={formData.radius}
                    onChange={(e) => handleChange("radius", e.target.value)}
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
                  <Label htmlFor="availableDate">Available Date *</Label>
                  <Input
                    id="availableDate"
                    type="date"
                    value={formData.availableDate}
                    onChange={(e) => handleChange("availableDate", e.target.value)}
                    required
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
                <Button type="submit" size="lg" variant="secondary" className="flex-1">
                  Post Truck
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

export default PostTruck;

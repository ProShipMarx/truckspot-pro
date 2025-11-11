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
import { Truck } from "lucide-react";
import { z } from "zod";

const truckFormSchema = z.object({
  location: z.string().trim().min(1, "Location is required").max(100, "Location must be less than 100 characters"),
  equipmentType: z.string().min(1, "Equipment type is required"),
  availableDate: z.string().min(1, "Available date is required"),
  radius: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 3000), {
    message: "Radius must be a positive number up to 3,000 miles"
  }),
  contactName: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  contactPhone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().refine((val) => !val || /^[\d\s\-\(\)\+]+$/.test(val), {
    message: "Phone number contains invalid characters"
  }),
  contactEmail: z.string().trim().max(255, "Email must be less than 255 characters").optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid email address"
  }),
});

const PostTruck = () => {
  const navigate = useNavigate();
  const { userRole, loading } = useApprovalStatus();

  useEffect(() => {
    if (!loading) {
      if (userRole !== "carrier" && userRole !== "admin") {
        toast.error("Only carriers can post trucks");
        navigate("/");
      }
    }
  }, [navigate, userRole, loading]);

  const [formData, setFormData] = useState({
    location: "",
    equipmentType: "",
    availableDate: "",
    radius: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data with zod schema
    const validation = truckFormSchema.safeParse(formData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to post a truck");
        navigate("/auth");
        return;
      }

      // @ts-ignore - Supabase types will regenerate after migration  
      const { error } = await (supabase as any)
        .from('trucks')
        .insert({
          user_id: session.user.id,
          location: formData.location,
          equipment_type: formData.equipmentType,
          available_date: formData.availableDate,
          radius: formData.radius ? Number(formData.radius) : null,
          contact_name: formData.contactName || null,
          contact_phone: formData.contactPhone || null,
          contact_email: formData.contactEmail || null,
        });

      if (error) throw error;

      toast.success("Truck posted successfully!");
      navigate("/find-trucks");
    } catch (error: any) {
      toast.error(error.message || "Failed to post truck");
    }
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

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck } from "@/types/freight";

interface EditTruckModalProps {
  truck: Truck;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditTruckModal = ({ truck, open, onOpenChange, onSuccess }: EditTruckModalProps) => {
  const [formData, setFormData] = useState({
    location: truck.location,
    equipmentType: truck.equipment_type,
    availableDate: truck.available_date,
    radius: truck.radius?.toString() || "",
    contactName: truck.contact_name || "",
    contactPhone: truck.contact_phone || "",
    contactEmail: truck.contact_email || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await (supabase as any)
        .from('trucks')
        .update({
          location: formData.location,
          equipment_type: formData.equipmentType,
          available_date: formData.availableDate,
          radius: formData.radius ? Number(formData.radius) : null,
          contact_name: formData.contactName || null,
          contact_phone: formData.contactPhone || null,
          contact_email: formData.contactEmail || null,
        })
        .eq('id', truck.id);

      if (error) throw error;

      toast.success("Truck updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update truck");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Truck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-location">Current Location *</Label>
              <Input
                id="edit-location"
                placeholder="e.g., Atlanta, GA"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-radius">Search Radius (miles)</Label>
              <Input
                id="edit-radius"
                type="number"
                placeholder="250"
                value={formData.radius}
                onChange={(e) => handleChange("radius", e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-equipmentType">Equipment Type *</Label>
              <Select value={formData.equipmentType} onValueChange={(value) => handleChange("equipmentType", value)}>
                <SelectTrigger id="edit-equipmentType">
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
              <Label htmlFor="edit-availableDate">Available Date *</Label>
              <Input
                id="edit-availableDate"
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
                <Label htmlFor="edit-contactName">Contact Name</Label>
                <Input
                  id="edit-contactName"
                  placeholder="John Doe"
                  value={formData.contactName}
                  onChange={(e) => handleChange("contactName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Phone Number</Label>
                <Input
                  id="edit-contactPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

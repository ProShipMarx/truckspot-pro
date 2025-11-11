import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Load } from "@/types/freight";
import { PlacesAutocomplete } from "./PlacesAutocomplete";
import { LoadMapWithRoute } from "./LoadMapWithRoute";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

interface EditLoadModalProps {
  load: Load;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditLoadModal = ({ load, open, onOpenChange, onSuccess }: EditLoadModalProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const [formData, setFormData] = useState({
    origin: load.origin,
    destination: load.destination,
    pickupDate: load.pickupDate,
    weight: load.weight.toString(),
    equipmentType: load.equipmentType,
    rate: load.rate.toString(),
    distance: load.distance.toString(),
    contactName: load.contactName,
    contactPhone: load.contactPhone,
    contactEmail: load.contactEmail,
  });

  const [originCoords, setOriginCoords] = useState({
    lat: load.origin_lat || 0,
    lng: load.origin_lng || 0,
  });

  const [destinationCoords, setDestinationCoords] = useState({
    lat: load.destination_lat || 0,
    lng: load.destination_lng || 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('loads')
        .update({
          origin: formData.origin,
          destination: formData.destination,
          origin_lat: originCoords.lat,
          origin_lng: originCoords.lng,
          destination_lat: destinationCoords.lat,
          destination_lng: destinationCoords.lng,
          pickup_date: formData.pickupDate,
          weight: Number(formData.weight),
          equipment_type: formData.equipmentType,
          rate: Number(formData.rate),
          distance: Number(formData.distance),
          contact_name: formData.contactName,
          contact_phone: formData.contactPhone,
          contact_email: formData.contactEmail,
        })
        .eq('id', load.id);

      if (error) throw error;

      toast.success("Load updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update load");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOriginChange = (address: string, place: google.maps.places.PlaceResult) => {
    setFormData(prev => ({ ...prev, origin: address }));
    if (place.geometry?.location) {
      setOriginCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleDestinationChange = (address: string, place: google.maps.places.PlaceResult) => {
    setFormData(prev => ({ ...prev, destination: address }));
    if (place.geometry?.location) {
      setDestinationCoords({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleDistanceCalculated = (distance: number) => {
    setFormData(prev => ({ ...prev, distance: distance.toString() }));
  };

  if (!isLoaded) return null;
  if (loadError) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Load</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-origin">Origin *</Label>
              <PlacesAutocomplete
                id="edit-origin"
                placeholder="e.g., Los Angeles, CA"
                value={formData.origin}
                onChange={handleOriginChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-destination">Destination *</Label>
              <PlacesAutocomplete
                id="edit-destination"
                placeholder="e.g., New York, NY"
                value={formData.destination}
                onChange={handleDestinationChange}
              />
            </div>
          </div>

          {originCoords.lat !== 0 && destinationCoords.lat !== 0 && (
            <div className="h-64 rounded-lg overflow-hidden border">
              <LoadMapWithRoute
                origin={originCoords}
                destination={destinationCoords}
                onDistanceCalculated={handleDistanceCalculated}
              />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pickupDate">Pickup Date *</Label>
              <Input
                id="edit-pickupDate"
                type="date"
                value={formData.pickupDate}
                onChange={(e) => handleChange("pickupDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-weight">Weight (lbs) *</Label>
              <Input
                id="edit-weight"
                type="number"
                placeholder="45000"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                required
              />
            </div>
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
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-rate">Rate ($) *</Label>
              <Input
                id="edit-rate"
                type="number"
                placeholder="2500"
                value={formData.rate}
                onChange={(e) => handleChange("rate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-distance">Distance (miles)</Label>
              <Input
                id="edit-distance"
                type="number"
                value={formData.distance}
                onChange={(e) => handleChange("distance", e.target.value)}
                disabled
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactName">Contact Name *</Label>
                <Input
                  id="edit-contactName"
                  placeholder="John Doe"
                  value={formData.contactName}
                  onChange={(e) => handleChange("contactName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Phone Number *</Label>
                <Input
                  id="edit-contactPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Email *</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  required
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

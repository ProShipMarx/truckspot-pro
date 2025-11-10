export interface Load {
  id: string;
  user_id?: string;
  origin: string;
  destination: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  pickupDate: string;
  weight: number;
  equipmentType: string;
  rate: number;
  distance: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  postedDate: string;
}

export interface Truck {
  id: string;
  location: string;
  equipmentType: string;
  availableDate: string;
  radius: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  postedDate: string;
}

export type EquipmentType = "Dry Van" | "Flatbed" | "Reefer" | "Step Deck" | "Tanker" | "Box Truck";

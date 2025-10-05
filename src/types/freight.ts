export interface Load {
  id: string;
  origin: string;
  destination: string;
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

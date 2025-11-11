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
  user_id?: string;
  location: string;
  equipment_type: string;
  available_date: string;
  radius?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export type EquipmentType = "Dry Van" | "Flatbed" | "Reefer" | "Step Deck" | "Tanker" | "Box Truck";

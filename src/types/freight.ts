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

export interface LoadAssignment {
  id: string;
  load_id: string;
  carrier_id: string;
  shipper_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up' | 'in_transit' | 'delivered';
  carrier_notes?: string;
  shipper_notes?: string;
  requested_at: string;
  responded_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  load?: Load;
  carrier_profile?: {
    id: string;
    email: string;
    company_name?: string;
    phone?: string;
    mc_number?: string;
  };
  shipper_profile?: {
    id: string;
    email: string;
    company_name?: string;
    phone?: string;
  };
  carrier_trucks?: Truck[];
}

export type EquipmentType = "Dry Van" | "Flatbed" | "Reefer" | "Step Deck" | "Tanker" | "Box Truck";

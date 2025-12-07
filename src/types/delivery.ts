export interface DeliveryConfirmation {
  id: string;
  load_assignment_id: string;
  
  // Carrier drop-off info
  carrier_confirmed_at?: string;
  carrier_latitude?: number;
  carrier_longitude?: number;
  carrier_distance_from_destination?: number;
  delivery_photo_url?: string;
  signature_url?: string;
  carrier_notes?: string;
  
  // Receiver confirmation
  receiver_id?: string;
  receiver_confirmed_at?: string;
  receiver_notes?: string;
  
  // Shipper confirmation
  shipper_confirmed_at?: string;
  shipper_notes?: string;
  
  // Status tracking
  status: 'pending' | 'carrier_confirmed' | 'partially_confirmed' | 'fully_confirmed' | 'disputed' | 'admin_review';
  confirmation_deadline?: string;
  escalated_to_admin_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ReceiverLink {
  id: string;
  load_id: string;
  confirmation_code: string;
  receiver_id?: string;
  shipper_id: string;
  claimed_at?: string;
  expires_at: string;
  created_at: string;
}

export const MAX_DISTANCE_MILES = 0.5; // Carrier must be within 0.5 miles
export const CONFIRMATION_TIMEOUT_HOURS = 1; // Hours before escalation to admin

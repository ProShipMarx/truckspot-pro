import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryConfirmation, ReceiverLink, MAX_DISTANCE_MILES, CONFIRMATION_TIMEOUT_HOURS } from '@/types/delivery';
import { toast } from 'sonner';

export const useDeliveryConfirmation = (loadAssignmentId?: string) => {
  const [confirmation, setConfirmation] = useState<DeliveryConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfirmation = useCallback(async () => {
    if (!loadAssignmentId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('delivery_confirmations')
        .select('*')
        .eq('load_assignment_id', loadAssignmentId)
        .maybeSingle();

      if (error) throw error;
      setConfirmation(data as DeliveryConfirmation | null);
    } catch (error: any) {
      console.error('Error fetching delivery confirmation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadAssignmentId]);

  useEffect(() => {
    fetchConfirmation();
  }, [fetchConfirmation]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const initiateCarrierDropOff = async (
    destinationLat: number,
    destinationLng: number,
    photoUrl: string,
    signatureUrl: string,
    notes?: string
  ) => {
    if (!loadAssignmentId) return { success: false, error: 'No assignment ID' };

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const carrierLat = position.coords.latitude;
      const carrierLng = position.coords.longitude;
      
      // Calculate distance from destination
      const distance = calculateDistance(carrierLat, carrierLng, destinationLat, destinationLng);
      
      if (distance > MAX_DISTANCE_MILES) {
        return { 
          success: false, 
          error: `You must be within ${MAX_DISTANCE_MILES} miles of the destination. Current distance: ${distance.toFixed(2)} miles` 
        };
      }

      // Calculate deadline (48 hours from now)
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + CONFIRMATION_TIMEOUT_HOURS);

      const { data, error } = await supabase
        .from('delivery_confirmations')
        .insert({
          load_assignment_id: loadAssignmentId,
          carrier_confirmed_at: new Date().toISOString(),
          carrier_latitude: carrierLat,
          carrier_longitude: carrierLng,
          carrier_distance_from_destination: distance,
          delivery_photo_url: photoUrl,
          signature_url: signatureUrl,
          carrier_notes: notes,
          status: 'carrier_confirmed',
          confirmation_deadline: deadline.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setConfirmation(data as DeliveryConfirmation);
      toast.success('Drop-off confirmed! Waiting for receiver and shipper confirmation.');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error initiating drop-off:', error);
      const message = error.message || 'Failed to confirm drop-off';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const confirmAsReceiver = async (notes?: string) => {
    if (!confirmation) return { success: false, error: 'No confirmation found' };

    try {
      const updateData: any = {
        receiver_confirmed_at: new Date().toISOString(),
        receiver_notes: notes
      };

      // Check if shipper also confirmed - if so, mark as fully confirmed
      if (confirmation.shipper_confirmed_at) {
        updateData.status = 'fully_confirmed';
      } else {
        updateData.status = 'partially_confirmed';
      }

      const { data, error } = await supabase
        .from('delivery_confirmations')
        .update(updateData)
        .eq('id', confirmation.id)
        .select()
        .single();

      if (error) throw error;

      setConfirmation(data as DeliveryConfirmation);
      toast.success('Delivery confirmed!');
      return { success: true };
    } catch (error: any) {
      console.error('Error confirming as receiver:', error);
      toast.error(error.message || 'Failed to confirm delivery');
      return { success: false, error: error.message };
    }
  };

  const confirmAsShipper = async (notes?: string) => {
    if (!confirmation) return { success: false, error: 'No confirmation found' };

    try {
      const updateData: any = {
        shipper_confirmed_at: new Date().toISOString(),
        shipper_notes: notes
      };

      // Check if receiver also confirmed - if so, mark as fully confirmed
      if (confirmation.receiver_confirmed_at) {
        updateData.status = 'fully_confirmed';
      } else {
        updateData.status = 'partially_confirmed';
      }

      const { data, error } = await supabase
        .from('delivery_confirmations')
        .update(updateData)
        .eq('id', confirmation.id)
        .select()
        .single();

      if (error) throw error;

      setConfirmation(data as DeliveryConfirmation);
      toast.success('Delivery confirmed!');
      return { success: true };
    } catch (error: any) {
      console.error('Error confirming as shipper:', error);
      toast.error(error.message || 'Failed to confirm delivery');
      return { success: false, error: error.message };
    }
  };

  const disputeDelivery = async (role: 'receiver' | 'shipper', reason: string) => {
    if (!confirmation) return { success: false, error: 'No confirmation found' };

    try {
      const updateData: any = {
        status: 'disputed'
      };

      if (role === 'receiver') {
        updateData.receiver_notes = `DISPUTE: ${reason}`;
      } else {
        updateData.shipper_notes = `DISPUTE: ${reason}`;
      }

      const { data, error } = await supabase
        .from('delivery_confirmations')
        .update(updateData)
        .eq('id', confirmation.id)
        .select()
        .single();

      if (error) throw error;

      setConfirmation(data as DeliveryConfirmation);
      toast.info('Dispute filed. An admin will review this delivery.');
      return { success: true };
    } catch (error: any) {
      console.error('Error disputing delivery:', error);
      toast.error(error.message || 'Failed to file dispute');
      return { success: false, error: error.message };
    }
  };

  return {
    confirmation,
    isLoading,
    initiateCarrierDropOff,
    confirmAsReceiver,
    confirmAsShipper,
    disputeDelivery,
    refetch: fetchConfirmation
  };
};

// Hook for managing receiver links
export const useReceiverLinks = (loadId?: string) => {
  const [receiverLink, setReceiverLink] = useState<ReceiverLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceiverLink = useCallback(async () => {
    if (!loadId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('receiver_links')
        .select('*')
        .eq('load_id', loadId)
        .maybeSingle();

      if (error) throw error;
      setReceiverLink(data as ReceiverLink | null);
    } catch (error: any) {
      console.error('Error fetching receiver link:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    fetchReceiverLink();
  }, [fetchReceiverLink]);

  const generateReceiverLink = async (shipperId: string) => {
    if (!loadId) return { success: false, error: 'No load ID' };

    try {
      // Generate code using the database function
      const { data: codeData } = await supabase.rpc('generate_confirmation_code');
      const code = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

      // Expires in 30 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data, error } = await supabase
        .from('receiver_links')
        .insert({
          load_id: loadId,
          confirmation_code: code,
          shipper_id: shipperId,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setReceiverLink(data as ReceiverLink);
      toast.success('Receiver confirmation code generated!');
      return { success: true, code: data.confirmation_code };
    } catch (error: any) {
      console.error('Error generating receiver link:', error);
      toast.error(error.message || 'Failed to generate code');
      return { success: false, error: error.message };
    }
  };

  const claimReceiverLink = async (confirmationCode: string, receiverId: string) => {
    try {
      // First find the link
      const { data: linkData, error: findError } = await supabase
        .from('receiver_links')
        .select('*')
        .eq('confirmation_code', confirmationCode.toUpperCase())
        .maybeSingle();

      if (findError) throw findError;
      if (!linkData) {
        return { success: false, error: 'Invalid confirmation code' };
      }

      // Check if expired
      if (new Date(linkData.expires_at) < new Date()) {
        return { success: false, error: 'This confirmation code has expired' };
      }

      // Check if already claimed
      if (linkData.receiver_id && linkData.receiver_id !== receiverId) {
        return { success: false, error: 'This code has already been claimed' };
      }

      // Claim the link
      const { data, error } = await supabase
        .from('receiver_links')
        .update({
          receiver_id: receiverId,
          claimed_at: new Date().toISOString()
        })
        .eq('id', linkData.id)
        .select()
        .single();

      if (error) throw error;

      setReceiverLink(data as ReceiverLink);
      toast.success('Successfully linked to this delivery!');
      return { success: true, loadId: data.load_id };
    } catch (error: any) {
      console.error('Error claiming receiver link:', error);
      toast.error(error.message || 'Failed to claim code');
      return { success: false, error: error.message };
    }
  };

  return {
    receiverLink,
    isLoading,
    generateReceiverLink,
    claimReceiverLink,
    refetch: fetchReceiverLink
  };
};

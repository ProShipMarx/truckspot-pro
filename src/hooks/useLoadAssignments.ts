import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadAssignment, Load, Truck } from '@/types/freight';
import { toast } from 'sonner';

export const useLoadAssignments = (userId?: string, role?: string | null) => {
  const [assignments, setAssignments] = useState<LoadAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignments = async () => {
    if (!userId || !role) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('load_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter based on role
      if (role === 'carrier') {
        query = query.eq('carrier_id', userId);
      } else if (role === 'shipper') {
        query = query.eq('shipper_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch related data
      const enrichedAssignments: LoadAssignment[] = await Promise.all(
        (data || []).map(async (assignment: any) => {
          // Fetch load details
          const { data: loadData } = await supabase
            .from('loads')
            .select('*')
            .eq('id', assignment.load_id)
            .single();

          // Fetch carrier profile
          const { data: carrierProfile } = await supabase
            .from('profiles')
            .select('id, email, company_name, phone, mc_number')
            .eq('id', assignment.carrier_id)
            .single();

          // Fetch shipper profile
          const { data: shipperProfile } = await supabase
            .from('profiles')
            .select('id, email, company_name, phone')
            .eq('id', assignment.shipper_id)
            .single();

          // Fetch carrier's trucks if shipper is viewing
          let carrierTrucks: Truck[] = [];
          if (role === 'shipper') {
            const { data: trucksData } = await supabase
              .from('trucks')
              .select('*')
              .eq('user_id', assignment.carrier_id)
              .is('deleted_at', null);
            carrierTrucks = trucksData || [];
          }

          const load: Load | undefined = loadData ? {
            id: loadData.id,
            user_id: loadData.user_id,
            origin: loadData.origin,
            destination: loadData.destination,
            origin_lat: loadData.origin_lat,
            origin_lng: loadData.origin_lng,
            destination_lat: loadData.destination_lat,
            destination_lng: loadData.destination_lng,
            pickupDate: loadData.pickup_date,
            weight: loadData.weight,
            equipmentType: loadData.equipment_type,
            rate: loadData.rate,
            distance: loadData.distance,
            contactName: loadData.contact_name,
            contactPhone: loadData.contact_phone,
            contactEmail: loadData.contact_email,
            postedDate: loadData.created_at,
          } : undefined;

          return {
            ...assignment,
            load,
            carrier_profile: carrierProfile,
            shipper_profile: shipperProfile,
            carrier_trucks: carrierTrucks,
          } as LoadAssignment;
        })
      );

      setAssignments(enrichedAssignments);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [userId, role]);

  const requestLoad = async (loadId: string, shipperId: string, notes?: string) => {
    if (!userId) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('load_assignments')
        .insert({
          load_id: loadId,
          carrier_id: userId,
          shipper_id: shipperId,
          carrier_notes: notes,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Load request submitted successfully');
      fetchAssignments();
      return { success: true };
    } catch (error: any) {
      console.error('Error requesting load:', error);
      toast.error(error.message || 'Failed to request load');
      return { success: false, error: error.message };
    }
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: LoadAssignment['status'],
    notes?: string
  ) => {
    try {
      const updateData: any = { status };
      
      if (status === 'accepted' || status === 'rejected') {
        updateData.responded_at = new Date().toISOString();
        if (notes) updateData.shipper_notes = notes;
      } else if (status === 'picked_up') {
        updateData.picked_up_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('load_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      const statusMessages: Record<string, string> = {
        accepted: 'Request accepted',
        rejected: 'Request rejected',
        picked_up: 'Load marked as picked up',
        in_transit: 'Load marked as in transit',
        delivered: 'Load marked as delivered',
      };

      toast.success(statusMessages[status] || 'Status updated');
      fetchAssignments();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error(error.message || 'Failed to update status');
      return { success: false, error: error.message };
    }
  };

  const getAssignmentForLoad = (loadId: string) => {
    return assignments.find(a => a.load_id === loadId);
  };

  const checkExistingRequest = async (loadId: string) => {
    if (!userId) return null;

    const { data } = await supabase
      .from('load_assignments')
      .select('*')
      .eq('load_id', loadId)
      .eq('carrier_id', userId)
      .single();

    return data;
  };

  return {
    assignments,
    isLoading,
    requestLoad,
    updateAssignmentStatus,
    getAssignmentForLoad,
    checkExistingRequest,
    refetch: fetchAssignments,
  };
};

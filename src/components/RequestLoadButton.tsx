import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Clock, CheckCircle, XCircle, Truck, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RequestLoadButtonProps {
  loadId: string;
  shipperId: string;
  currentUserId?: string;
  userRole?: string | null;
  onRequestSent?: () => void;
}

type AssignmentStatus = 'pending' | 'accepted' | 'rejected' | 'picked_up' | 'in_transit' | 'delivered' | null;

export const RequestLoadButton = ({
  loadId,
  shipperId,
  currentUserId,
  userRole,
  onRequestSent,
}: RequestLoadButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingStatus, setExistingStatus] = useState<AssignmentStatus>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkExistingRequest();
  }, [loadId, currentUserId]);

  const checkExistingRequest = async () => {
    if (!currentUserId) {
      setIsChecking(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('load_assignments')
        .select('status')
        .eq('load_id', loadId)
        .eq('carrier_id', currentUserId)
        .maybeSingle();

      setExistingStatus(data?.status as AssignmentStatus || null);
    } catch (error) {
      console.error('Error checking request:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUserId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('load_assignments')
        .insert({
          load_id: loadId,
          carrier_id: currentUserId,
          shipper_id: shipperId,
          carrier_notes: notes || null,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Load request submitted successfully');
      setDialogOpen(false);
      setNotes('');
      setExistingStatus('pending');
      onRequestSent?.();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      if (error.code === '23505') {
        toast.error('You have already requested this load');
        setExistingStatus('pending');
      } else {
        toast.error(error.message || 'Failed to submit request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show for non-carriers or own loads
  if (userRole !== 'carrier' || currentUserId === shipperId || !currentUserId) {
    return null;
  }

  if (isChecking) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Clock className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  // Show status badge if already requested
  if (existingStatus) {
    const statusConfig: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { icon: <Clock className="h-3 w-3" />, variant: 'secondary', label: 'Request Pending' },
      accepted: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default', label: 'Accepted' },
      rejected: { icon: <XCircle className="h-3 w-3" />, variant: 'destructive', label: 'Rejected' },
      picked_up: { icon: <Package className="h-3 w-3" />, variant: 'default', label: 'Picked Up' },
      in_transit: { icon: <Truck className="h-3 w-3" />, variant: 'default', label: 'In Transit' },
      delivered: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default', label: 'Delivered' },
    };

    const config = statusConfig[existingStatus];
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="gap-2"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDialogOpen(true);
        }}
      >
        <Send className="h-4 w-4" />
        Request Load
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Request This Load</DialogTitle>
            <DialogDescription>
              Send a request to the shipper to haul this load. They will review your profile and equipment before accepting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Message to Shipper (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Introduce yourself, mention your experience, or ask any questions about the load..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

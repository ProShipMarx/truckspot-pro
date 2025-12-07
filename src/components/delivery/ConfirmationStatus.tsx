import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDeliveryConfirmation } from '@/hooks/useDeliveryConfirmation';
import { useDeliveryProofUrls } from '@/hooks/useSignedUrl';
import { CheckCircle2, Clock, AlertTriangle, Loader2, XCircle, User, Truck as TruckIcon, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface ConfirmationStatusProps {
  loadAssignmentId: string;
  role: 'shipper' | 'receiver';
  onConfirmed?: () => void;
}

export const ConfirmationStatus = ({
  loadAssignmentId,
  role,
  onConfirmed
}: ConfirmationStatusProps) => {
  const { confirmation, isLoading, confirmAsReceiver, confirmAsShipper, disputeDelivery } = useDeliveryConfirmation(loadAssignmentId);
  const { photoUrl, signatureUrl, isLoading: urlsLoading } = useDeliveryProofUrls(
    confirmation?.delivery_photo_url,
    confirmation?.signature_url
  );
  const [notes, setNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    const result = role === 'receiver' 
      ? await confirmAsReceiver(notes)
      : await confirmAsShipper(notes);
    
    if (result.success) {
      onConfirmed?.();
    }
    setIsConfirming(false);
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setIsDisputing(true);
    await disputeDelivery(role, disputeReason);
    setShowDispute(false);
    setIsDisputing(false);
  };

  if (isLoading || urlsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // No confirmation initiated yet
  if (!confirmation) {
    return (
      <Card className="border-muted">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Awaiting Drop-off</h3>
              <p className="text-sm text-muted-foreground">
                The carrier has not yet confirmed drop-off
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const myConfirmation = role === 'receiver' ? confirmation.receiver_confirmed_at : confirmation.shipper_confirmed_at;
  const otherConfirmation = role === 'receiver' ? confirmation.shipper_confirmed_at : confirmation.receiver_confirmed_at;
  
  const isFullyConfirmed = confirmation.status === 'fully_confirmed';
  const isDisputed = confirmation.status === 'disputed' || confirmation.status === 'admin_review';

  // Show dispute status
  if (isDisputed) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-semibold text-destructive">Delivery Disputed</h3>
              <p className="text-sm text-muted-foreground">
                This delivery is under admin review
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fully confirmed
  if (isFullyConfirmed) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-400">Delivery Fully Confirmed</h3>
              <p className="text-sm text-muted-foreground">
                All parties have confirmed this delivery
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already confirmed by this user
  if (myConfirmation) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-400">You've Confirmed</h3>
              <p className="text-sm text-muted-foreground">
                Waiting for {role === 'receiver' ? 'shipper' : 'receiver'} confirmation
              </p>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="flex flex-col items-center p-2 rounded-lg bg-green-500/10">
              <TruckIcon className="h-5 w-5 text-green-500 mb-1" />
              <span className="text-xs text-green-400">Carrier</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded-lg ${role === 'receiver' ? 'bg-green-500/10' : otherConfirmation ? 'bg-green-500/10' : 'bg-muted/50'}`}>
              <Package className="h-5 w-5 mb-1" style={{ color: role === 'receiver' || otherConfirmation ? 'rgb(34 197 94)' : undefined }} />
              <span className={`text-xs ${role === 'receiver' || otherConfirmation ? 'text-green-400' : 'text-muted-foreground'}`}>Receiver</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded-lg ${role === 'shipper' ? 'bg-green-500/10' : otherConfirmation ? 'bg-green-500/10' : 'bg-muted/50'}`}>
              <User className="h-5 w-5 mb-1" style={{ color: role === 'shipper' || otherConfirmation ? 'rgb(34 197 94)' : undefined }} />
              <span className={`text-xs ${role === 'shipper' || otherConfirmation ? 'text-green-400' : 'text-muted-foreground'}`}>Shipper</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Needs confirmation from this user
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Confirm Delivery</CardTitle>
          <CardDescription>
            Carrier dropped off at {confirmation.carrier_confirmed_at && format(new Date(confirmation.carrier_confirmed_at), 'MMM d, yyyy h:mm a')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Delivery proof preview */}
          {photoUrl && (
            <div className="space-y-2">
              <Label>Delivery Photo</Label>
              <img 
                src={photoUrl} 
                alt="Delivery proof" 
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {signatureUrl && (
            <div className="space-y-2">
              <Label>Signature</Label>
              <img 
                src={signatureUrl} 
                alt="Signature" 
                className="w-full h-24 object-contain rounded-lg bg-muted/50"
              />
            </div>
          )}

          {confirmation.carrier_notes && (
            <div className="space-y-2">
              <Label>Carrier Notes</Label>
              <p className="text-sm text-muted-foreground p-2 bg-muted/30 rounded">
                {confirmation.carrier_notes}
              </p>
            </div>
          )}

          {/* Deadline warning */}
          {confirmation.confirmation_deadline && (
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 p-2 rounded">
              <Clock className="h-4 w-4" />
              Confirm by {format(new Date(confirmation.confirmation_deadline), 'MMM d, yyyy h:mm a')}
            </div>
          )}

          {/* Notes input */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any notes about the delivery..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Delivery
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDispute(true)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Dispute
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      <Dialog open={showDispute} onOpenChange={setShowDispute}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Delivery</DialogTitle>
            <DialogDescription>
              Please provide a reason for disputing this delivery. An admin will review your case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Describe the issue with this delivery..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispute(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDispute}
              disabled={!disputeReason.trim() || isDisputing}
            >
              {isDisputing ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

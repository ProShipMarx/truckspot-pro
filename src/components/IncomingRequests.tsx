import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package,
  Phone,
  Mail,
  Building,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { LoadAssignment } from '@/types/freight';
import { useLoadAssignments } from '@/hooks/useLoadAssignments';

interface IncomingRequestsProps {
  userId: string;
}

export const IncomingRequests = ({ userId }: IncomingRequestsProps) => {
  const { assignments, isLoading, updateAssignmentStatus } = useLoadAssignments(userId, 'shipper');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<LoadAssignment | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const statusConfig: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, variant: 'secondary', label: 'Pending' },
    accepted: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default', label: 'Accepted' },
    rejected: { icon: <XCircle className="h-3 w-3" />, variant: 'destructive', label: 'Rejected' },
    picked_up: { icon: <Package className="h-3 w-3" />, variant: 'default', label: 'Picked Up' },
    in_transit: { icon: <Truck className="h-3 w-3" />, variant: 'default', label: 'In Transit' },
    delivered: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default', label: 'Delivered' },
  };

  const handleAccept = async (assignmentId: string) => {
    setUpdatingId(assignmentId);
    await updateAssignmentStatus(assignmentId, 'accepted');
    setUpdatingId(null);
  };

  const handleRejectClick = (assignment: LoadAssignment) => {
    setSelectedAssignment(assignment);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedAssignment) return;
    
    setUpdatingId(selectedAssignment.id);
    await updateAssignmentStatus(selectedAssignment.id, 'rejected', rejectReason);
    setUpdatingId(null);
    setRejectDialogOpen(false);
    setSelectedAssignment(null);
  };

  const filterAssignments = (statuses: string[]) => {
    return assignments.filter(a => statuses.includes(a.status));
  };

  const renderAssignment = (assignment: LoadAssignment) => {
    const config = statusConfig[assignment.status];
    const load = assignment.load;
    const carrier = assignment.carrier_profile;
    const trucks = assignment.carrier_trucks || [];

    return (
      <Card key={assignment.id}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={config.variant} className="gap-1">
                  {config.icon}
                  {config.label}
                </Badge>
                {load && <Badge variant="outline">{load.equipmentType}</Badge>}
              </div>

              {load && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{load.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold">{load.destination}</span>
                </div>
              )}

              {/* Carrier Information */}
              {carrier && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm font-medium">Carrier Information:</p>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    {carrier.company_name && (
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{carrier.company_name}</span>
                      </div>
                    )}
                    {carrier.mc_number && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>MC# {carrier.mc_number}</span>
                      </div>
                    )}
                    {carrier.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${carrier.phone}`} className="text-primary hover:underline">
                          {carrier.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${carrier.email}`} className="text-primary hover:underline">
                        {carrier.email}
                      </a>
                    </div>
                  </div>

                  {/* Carrier's Equipment */}
                  {trucks.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground mb-1">Available Equipment:</p>
                      <div className="flex gap-2 flex-wrap">
                        {trucks.map(truck => (
                          <Badge key={truck.id} variant="secondary" className="gap-1">
                            <Truck className="h-3 w-3" />
                            {truck.equipment_type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {assignment.carrier_notes && (
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Carrier message:</span> "{assignment.carrier_notes}"
                  </p>
                </div>
              )}

              {load && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Pickup: {format(new Date(load.pickupDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>${load.rate?.toLocaleString()}</span>
                  </div>
                  <span>{load.distance} miles</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Requested {format(new Date(assignment.requested_at), "MMM d 'at' h:mm a")}
              </p>
            </div>

            {/* Action buttons for pending requests */}
            {assignment.status === 'pending' && (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(assignment.id)}
                  disabled={updatingId === assignment.id}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectClick(assignment)}
                  disabled={updatingId === assignment.id}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}

            {/* Status badge for non-pending */}
            {assignment.status !== 'pending' && (
              <Badge variant={config.variant} className="gap-1">
                {config.icon}
                {config.label}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = filterAssignments(['pending']);
  const activeRequests = filterAssignments(['accepted', 'picked_up', 'in_transit']);
  const completedRequests = filterAssignments(['delivered']);
  const allRequests = assignments;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
          <CardDescription>Manage carrier requests for your loads</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeRequests.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({allRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending requests</p>
              ) : (
                pendingRequests.map(renderAssignment)
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No active shipments</p>
              ) : (
                activeRequests.map(renderAssignment)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No completed shipments</p>
              ) : (
                completedRequests.map(renderAssignment)
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No requests yet</p>
              ) : (
                allRequests.map(renderAssignment)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this carrier's request (optional).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason (Optional)</Label>
              <Textarea
                id="rejectReason"
                placeholder="e.g., Load has already been assigned, equipment doesn't match requirements..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

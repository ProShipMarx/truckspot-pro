import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Building
} from 'lucide-react';
import { format } from 'date-fns';
import { LoadAssignment } from '@/types/freight';
import { useLoadAssignments } from '@/hooks/useLoadAssignments';

interface MyRequestsProps {
  userId: string;
}

export const MyRequests = ({ userId }: MyRequestsProps) => {
  const { assignments, isLoading, updateAssignmentStatus } = useLoadAssignments(userId, 'carrier');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const statusConfig: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, variant: 'secondary', label: 'Pending' },
    accepted: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default', label: 'Accepted' },
    rejected: { icon: <XCircle className="h-3 w-3" />, variant: 'destructive', label: 'Rejected' },
    picked_up: { icon: <Package className="h-3 w-3" />, variant: 'default', label: 'Picked Up' },
    in_transit: { icon: <Truck className="h-3 w-3" />, variant: 'default', label: 'In Transit' },
    delivered: { icon: <CheckCircle className="h-3 w-3" />, variant: 'default', label: 'Delivered' },
  };

  const handleStatusUpdate = async (assignmentId: string, newStatus: LoadAssignment['status']) => {
    setUpdatingId(assignmentId);
    await updateAssignmentStatus(assignmentId, newStatus);
    setUpdatingId(null);
  };

  const filterAssignments = (statuses: string[]) => {
    return assignments.filter(a => statuses.includes(a.status));
  };

  const renderAssignment = (assignment: LoadAssignment) => {
    const config = statusConfig[assignment.status];
    const load = assignment.load;

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
                <>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{load.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-semibold">{load.destination}</span>
                  </div>

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

                  {/* Show shipper contact only if accepted */}
                  {['accepted', 'picked_up', 'in_transit', 'delivered'].includes(assignment.status) && assignment.shipper_profile && (
                    <div className="pt-3 border-t space-y-2">
                      <p className="text-sm font-medium">Shipper Contact:</p>
                      <div className="flex items-center gap-4 text-sm">
                        {assignment.shipper_profile.company_name && (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.shipper_profile.company_name}</span>
                          </div>
                        )}
                        {assignment.shipper_profile.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${assignment.shipper_profile.phone}`} className="text-primary hover:underline">
                              {assignment.shipper_profile.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${assignment.shipper_profile.email}`} className="text-primary hover:underline">
                            {assignment.shipper_profile.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {assignment.carrier_notes && (
                <p className="text-sm text-muted-foreground italic">"{assignment.carrier_notes}"</p>
              )}

              {assignment.shipper_notes && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Shipper note:</span> {assignment.shipper_notes}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Requested {format(new Date(assignment.requested_at), "MMM d 'at' h:mm a")}
              </p>
            </div>

            {/* Action buttons based on status */}
            <div className="flex flex-col gap-2">
              {assignment.status === 'accepted' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(assignment.id, 'picked_up')}
                  disabled={updatingId === assignment.id}
                >
                  Mark Picked Up
                </Button>
              )}
              {assignment.status === 'picked_up' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(assignment.id, 'in_transit')}
                  disabled={updatingId === assignment.id}
                >
                  Mark In Transit
                </Button>
              )}
              {assignment.status === 'in_transit' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate(assignment.id, 'delivered')}
                  disabled={updatingId === assignment.id}
                >
                  Mark Delivered
                </Button>
              )}
            </div>
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
  const rejectedRequests = filterAssignments(['rejected']);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Load Requests</CardTitle>
        <CardDescription>Track your load requests and active hauls</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeRequests.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active hauls</p>
            ) : (
              activeRequests.map(renderAssignment)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending requests</p>
            ) : (
              pendingRequests.map(renderAssignment)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No completed hauls</p>
            ) : (
              completedRequests.map(renderAssignment)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No rejected requests</p>
            ) : (
              rejectedRequests.map(renderAssignment)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

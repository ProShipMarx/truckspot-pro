import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, Clock, AlertTriangle, MapPin, Calendar, KeyRound, Inbox } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ReceiverCodeClaim } from "@/components/delivery/ReceiverCodeClaim";
import { ConfirmationStatus } from "@/components/delivery/ConfirmationStatus";
import { useDeliveryConfirmation } from "@/hooks/useDeliveryConfirmation";

interface LinkedDelivery {
  id: string;
  load_id: string;
  confirmation_code: string;
  claimed_at: string | null;
  expires_at: string;
  load?: {
    id: string;
    origin: string;
    destination: string;
    pickup_date: string;
    equipment_type: string;
  };
  assignment?: {
    id: string;
    status: string;
    carrier_id: string;
    shipper_id: string;
  };
  confirmation?: {
    id: string;
    status: string;
    carrier_confirmed_at: string | null;
    receiver_confirmed_at: string | null;
    shipper_confirmed_at: string | null;
    delivery_photo_url: string | null;
    signature_url: string | null;
  };
  shipper_profile?: {
    company_name: string | null;
    email: string;
    phone: string | null;
  };
  carrier_profile?: {
    company_name: string | null;
    email: string;
    phone: string | null;
  };
}

const ReceiverDashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useApprovalStatus();
  const [deliveries, setDeliveries] = useState<LinkedDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (userRole && userRole !== "receiver" && userRole !== "admin") {
        navigate("/my-loads");
      }
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    if (user && (userRole === "receiver" || userRole === "admin")) {
      fetchDeliveries();
    }
  }, [user, userRole]);

  const fetchDeliveries = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch receiver links for this user
      const { data: links, error } = await supabase
        .from('receiver_links')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (links && links.length > 0) {
        // Enrich with related data
        const enrichedDeliveries = await Promise.all(links.map(async (link) => {
          // Get load details
          const { data: load } = await supabase
            .from('loads')
            .select('id, origin, destination, pickup_date, equipment_type')
            .eq('id', link.load_id)
            .maybeSingle();

          // Get assignment
          const { data: assignment } = await supabase
            .from('load_assignments')
            .select('id, status, carrier_id, shipper_id')
            .eq('load_id', link.load_id)
            .maybeSingle();

          let confirmation = null;
          let shipper_profile = null;
          let carrier_profile = null;

          if (assignment) {
            // Get confirmation
            const { data: conf } = await supabase
              .from('delivery_confirmations')
              .select('*')
              .eq('load_assignment_id', assignment.id)
              .maybeSingle();
            confirmation = conf;

            // Get profiles
            const { data: shipper } = await supabase
              .from('profiles')
              .select('company_name, email, phone')
              .eq('id', assignment.shipper_id)
              .maybeSingle();
            shipper_profile = shipper;

            const { data: carrier } = await supabase
              .from('profiles')
              .select('company_name, email, phone')
              .eq('id', assignment.carrier_id)
              .maybeSingle();
            carrier_profile = carrier;
          }

          return {
            ...link,
            load,
            assignment,
            confirmation,
            shipper_profile,
            carrier_profile,
          };
        }));

        setDeliveries(enrichedDeliveries);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to load deliveries");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (delivery: LinkedDelivery) => {
    if (!delivery.confirmation) {
      if (!delivery.assignment || delivery.assignment.status === "pending") {
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Awaiting Assignment</Badge>;
      }
      if (delivery.assignment.status === "accepted" || delivery.assignment.status === "in_transit") {
        return <Badge variant="default"><Package className="h-3 w-3 mr-1" />In Transit</Badge>;
      }
    }

    if (delivery.confirmation) {
      if (delivery.confirmation.receiver_confirmed_at) {
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>;
      }
      if (delivery.confirmation.carrier_confirmed_at && !delivery.confirmation.receiver_confirmed_at) {
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Awaiting Your Confirmation</Badge>;
      }
      if (delivery.confirmation.status === "disputed") {
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Disputed</Badge>;
      }
    }

    return <Badge variant="secondary">Unknown</Badge>;
  };

  // Categorize deliveries
  const pendingConfirmation = deliveries.filter(d => 
    d.confirmation?.carrier_confirmed_at && !d.confirmation?.receiver_confirmed_at && d.confirmation?.status !== "disputed"
  );
  const inTransit = deliveries.filter(d => 
    d.assignment && ["accepted", "picked_up", "in_transit"].includes(d.assignment.status) && !d.confirmation?.carrier_confirmed_at
  );
  const confirmed = deliveries.filter(d => d.confirmation?.receiver_confirmed_at);
  const disputed = deliveries.filter(d => d.confirmation?.status === "disputed");

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const DeliveryCard = ({ delivery, showActions = false }: { delivery: LinkedDelivery; showActions?: boolean }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(delivery)}
                {delivery.load && <Badge variant="outline">{delivery.load.equipment_type}</Badge>}
              </div>
              {delivery.load && (
                <>
                  <div className="flex items-center gap-2 font-semibold">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {delivery.load.origin} → {delivery.load.destination}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Pickup: {format(new Date(delivery.load.pickup_date), "MMM d, yyyy")}
                  </div>
                </>
              )}
              <div className="text-sm text-muted-foreground">
                Code: <span className="font-mono">{delivery.confirmation_code}</span>
              </div>
              {delivery.shipper_profile && (
                <div className="text-sm">
                  Shipper: {delivery.shipper_profile.company_name || delivery.shipper_profile.email}
                </div>
              )}
              {delivery.carrier_profile && (
                <div className="text-sm">
                  Carrier: {delivery.carrier_profile.company_name || delivery.carrier_profile.email}
                </div>
              )}
            </div>
          </div>

          {showActions && delivery.assignment && (
            <div className="pt-4 border-t">
              <ConfirmationStatus 
                loadAssignmentId={delivery.assignment.id}
                role="receiver"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Inbox className="h-8 w-8 text-secondary" />
            <h1 className="text-3xl font-bold">My Deliveries</h1>
          </div>
          <p className="text-muted-foreground">
            Track and confirm your incoming deliveries
          </p>
        </div>

        {/* Claim New Delivery Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Claim New Delivery
            </CardTitle>
            <CardDescription>
              Enter the confirmation code provided by the shipper to link a delivery to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReceiverCodeClaim />
          </CardContent>
        </Card>

        {/* Pending Confirmation Alert */}
        {pendingConfirmation.length > 0 && (
          <Card className="mb-6 border-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Action Required: {pendingConfirmation.length} Delivery Confirmation{pendingConfirmation.length > 1 ? "s" : ""} Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingConfirmation.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} showActions />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tabs for different states */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({deliveries.length})</TabsTrigger>
            <TabsTrigger value="in_transit">In Transit ({inTransit.length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
            <TabsTrigger value="disputed">Disputed ({disputed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {deliveries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No deliveries yet</h3>
                  <p className="text-muted-foreground">
                    Use a confirmation code from a shipper to start tracking your deliveries
                  </p>
                </CardContent>
              </Card>
            ) : (
              deliveries.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))
            )}
          </TabsContent>

          <TabsContent value="in_transit" className="space-y-4">
            {inTransit.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deliveries in transit</p>
            ) : (
              inTransit.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4">
            {confirmed.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No confirmed deliveries</p>
            ) : (
              confirmed.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))
            )}
          </TabsContent>

          <TabsContent value="disputed" className="space-y-4">
            {disputed.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No disputed deliveries</p>
            ) : (
              disputed.map(delivery => (
                <DeliveryCard key={delivery.id} delivery={delivery} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ReceiverDashboard;

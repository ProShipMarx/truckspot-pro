import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Truck, Clock, CheckCircle2, AlertCircle, MapPin, Calendar, DollarSign, Eye } from "lucide-react";
import { format } from "date-fns";

interface LoadAssignment {
  id: string;
  load_id: string;
  carrier_id: string;
  shipper_id: string;
  status: string;
  created_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  load?: {
    id: string;
    origin: string;
    destination: string;
    pickup_date: string;
    rate: number | null;
    equipment_type: string;
  };
  carrier_profile?: {
    company_name: string | null;
    email: string;
    phone: string | null;
  };
  shipper_profile?: {
    company_name: string | null;
    email: string;
    phone: string | null;
  };
}

interface ReceiverLoad {
  id: string;
  load_id: string;
  confirmation_code: string;
  claimed_at: string | null;
  load?: {
    id: string;
    origin: string;
    destination: string;
    pickup_date: string;
  };
  confirmation?: {
    status: string;
    receiver_confirmed_at: string | null;
  };
}

const MyLoads = () => {
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useApprovalStatus();
  const [assignments, setAssignments] = useState<LoadAssignment[]>([]);
  const [receiverLoads, setReceiverLoads] = useState<ReceiverLoad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && userRole) {
      fetchData();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (userRole === "shipper" || userRole === "admin") {
        // Fetch assignments where user is shipper
        const { data: shipperAssignments } = await supabase
          .from('load_assignments')
          .select('*')
          .eq('shipper_id', user.id)
          .order('created_at', { ascending: false });

        if (shipperAssignments) {
          const enriched = await enrichAssignments(shipperAssignments);
          setAssignments(enriched);
        }
      }

      if (userRole === "carrier" || userRole === "admin") {
        // Fetch assignments where user is carrier
        const { data: carrierAssignments } = await supabase
          .from('load_assignments')
          .select('*')
          .eq('carrier_id', user.id)
          .order('created_at', { ascending: false });

        if (carrierAssignments) {
          const enriched = await enrichAssignments(carrierAssignments);
          setAssignments(prev => 
            userRole === "admin" 
              ? [...prev, ...enriched.filter(e => !prev.some(p => p.id === e.id))]
              : enriched
          );
        }
      }

      if (userRole === "receiver") {
        // Fetch receiver links
        const { data: links } = await supabase
          .from('receiver_links')
          .select('*')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });

        if (links) {
          const enrichedLinks = await Promise.all(links.map(async (link) => {
            const { data: load } = await supabase
              .from('loads')
              .select('id, origin, destination, pickup_date')
              .eq('id', link.load_id)
              .maybeSingle();

            // Get assignment for this load
            const { data: assignment } = await supabase
              .from('load_assignments')
              .select('id')
              .eq('load_id', link.load_id)
              .maybeSingle();

            let confirmation = null;
            if (assignment) {
              const { data: conf } = await supabase
                .from('delivery_confirmations')
                .select('status, receiver_confirmed_at')
                .eq('load_assignment_id', assignment.id)
                .maybeSingle();
              confirmation = conf;
            }

            return { ...link, load, confirmation };
          }));
          setReceiverLoads(enrichedLinks);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const enrichAssignments = async (assignments: any[]): Promise<LoadAssignment[]> => {
    const loadIds = [...new Set(assignments.map(a => a.load_id))];
    const carrierIds = [...new Set(assignments.map(a => a.carrier_id))];
    const shipperIds = [...new Set(assignments.map(a => a.shipper_id))];

    const [loadsRes, carriersRes, shippersRes] = await Promise.all([
      supabase.from('loads').select('id, origin, destination, pickup_date, rate, equipment_type').in('id', loadIds),
      supabase.from('profiles').select('id, company_name, email, phone').in('id', carrierIds),
      supabase.from('profiles').select('id, company_name, email, phone').in('id', shipperIds),
    ]);

    return assignments.map(a => ({
      ...a,
      load: loadsRes.data?.find(l => l.id === a.load_id),
      carrier_profile: carriersRes.data?.find(c => c.id === a.carrier_id),
      shipper_profile: shippersRes.data?.find(s => s.id === a.shipper_id),
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      accepted: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
      rejected: { variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
      picked_up: { variant: "default", icon: <Truck className="h-3 w-3" /> },
      in_transit: { variant: "default", icon: <Truck className="h-3 w-3" /> },
      delivered: { variant: "outline", icon: <CheckCircle2 className="h-3 w-3" /> },
    };
    const config = statusConfig[status] || { variant: "secondary" as const, icon: null };
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 capitalize">
        {config.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

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

  // Filter assignments by status
  const active = assignments.filter(a => ["accepted", "picked_up", "in_transit"].includes(a.status));
  const pending = assignments.filter(a => a.status === "pending");
  const completed = assignments.filter(a => a.status === "delivered");
  const rejected = assignments.filter(a => a.status === "rejected");

  const AssignmentCard = ({ assignment }: { assignment: LoadAssignment }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/loads/${assignment.load_id}`)}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(assignment.status)}
              <Badge variant="outline">{assignment.load?.equipment_type}</Badge>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {assignment.load?.origin} → {assignment.load?.destination}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {assignment.load?.pickup_date && format(new Date(assignment.load.pickup_date), "MMM d, yyyy")}
              </div>
              {assignment.load?.rate && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {assignment.load.rate.toLocaleString()}
                </div>
              )}
            </div>
            <div className="text-sm">
              {userRole === "carrier" ? (
                <span>Shipper: {assignment.shipper_profile?.company_name || assignment.shipper_profile?.email}</span>
              ) : (
                <span>Carrier: {assignment.carrier_profile?.company_name || assignment.carrier_profile?.email}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ReceiverLoadCard = ({ load }: { load: ReceiverLoad }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {load.confirmation ? (
                getStatusBadge(load.confirmation.receiver_confirmed_at ? "confirmed" : load.confirmation.status)
              ) : (
                <Badge variant="secondary">Awaiting Delivery</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {load.load?.origin} → {load.load?.destination}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {load.load?.pickup_date && format(new Date(load.load.pickup_date), "MMM d, yyyy")}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Code: {load.confirmation_code}
            </div>
          </div>
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
            <Package className="h-8 w-8 text-secondary" />
            <h1 className="text-3xl font-bold">My Loads</h1>
          </div>
          <p className="text-muted-foreground">
            Track all your shipments in one place
          </p>
        </div>

        {userRole === "receiver" ? (
          // Receiver-specific view
          <Tabs defaultValue="linked" className="space-y-6">
            <TabsList>
              <TabsTrigger value="linked">Linked Deliveries ({receiverLoads.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Confirmation ({receiverLoads.filter(l => l.confirmation && !l.confirmation.receiver_confirmed_at).length})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({receiverLoads.filter(l => l.confirmation?.receiver_confirmed_at).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="linked" className="space-y-4">
              {receiverLoads.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No linked deliveries</h3>
                    <p className="text-muted-foreground mb-4">
                      Use a confirmation code from a shipper to link deliveries to your account
                    </p>
                    <Button onClick={() => navigate("/claim-delivery")}>
                      Claim Delivery
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                receiverLoads.map(load => <ReceiverLoadCard key={load.id} load={load} />)
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {receiverLoads.filter(l => l.confirmation && !l.confirmation.receiver_confirmed_at).map(load => (
                <ReceiverLoadCard key={load.id} load={load} />
              ))}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-4">
              {receiverLoads.filter(l => l.confirmation?.receiver_confirmed_at).map(load => (
                <ReceiverLoadCard key={load.id} load={load} />
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          // Shipper/Carrier view
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {active.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active shipments</h3>
                    <p className="text-muted-foreground">
                      Accepted loads that are picked up or in transit will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                active.map(a => <AssignmentCard key={a.id} assignment={a} />)
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pending.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                    <p className="text-muted-foreground">
                      {userRole === "carrier" 
                        ? "Your load requests awaiting shipper response will appear here"
                        : "Carrier requests for your loads will appear here"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pending.map(a => <AssignmentCard key={a.id} assignment={a} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completed.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No completed deliveries</h3>
                    <p className="text-muted-foreground">
                      Successfully delivered loads will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completed.map(a => <AssignmentCard key={a.id} assignment={a} />)
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejected.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No rejected requests
                  </CardContent>
                </Card>
              ) : (
                rejected.map(a => <AssignmentCard key={a.id} assignment={a} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MyLoads;

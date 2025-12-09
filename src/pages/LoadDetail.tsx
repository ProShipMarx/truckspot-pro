import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Weight, Truck, DollarSign, Phone, Mail, User } from "lucide-react";
import { format } from "date-fns";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { LoadMapWithRoute } from "@/components/LoadMapWithRoute";
import { Load } from "@/types/freight";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { GenerateReceiverCode } from "@/components/delivery/GenerateReceiverCode";

const LoadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoaded, loadError } = useGoogleMaps();
  const { user, userRole } = useApprovalStatus();
  const [load, setLoad] = useState<Load | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const isOwnLoad = user && load && user.id === load.user_id;
  const canGenerateReceiverCode = isOwnLoad && (userRole === "shipper" || userRole === "admin");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchLoad = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching load:", error);
        navigate("/find-loads");
        return;
      }

      setLoad({
        id: data.id,
        user_id: data.user_id,
        origin: data.origin,
        destination: data.destination,
        origin_lat: data.origin_lat,
        origin_lng: data.origin_lng,
        destination_lat: data.destination_lat,
        destination_lng: data.destination_lng,
        pickupDate: data.pickup_date,
        weight: data.weight,
        equipmentType: data.equipment_type,
        rate: data.rate,
        distance: data.distance,
        contactName: data.contact_name,
        contactPhone: data.contact_phone,
        contactEmail: data.contact_email,
        postedDate: data.created_at,
      });
      setLoading(false);
    };

    fetchLoad();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Load not found</p>
        </div>
      </div>
    );
  }

  const originCoords = load.origin_lat && load.origin_lng ? { lat: load.origin_lat, lng: load.origin_lng } : null;
  const destinationCoords = load.destination_lat && load.destination_lng ? { lat: load.destination_lat, lng: load.destination_lng } : null;
  const ratePerMile = load.rate && load.distance ? (load.rate / load.distance).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/find-loads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loads
          </Link>
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Load Details</CardTitle>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {load.equipmentType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Route */}
                <div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{load.origin}</div>
                      <div className="text-muted-foreground my-2">↓</div>
                      <div className="font-semibold text-lg">{load.destination}</div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {load.distance ? `${load.distance} miles` : 'Distance not available'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rate */}
                {isAuthenticated && (
                  <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    <div>
                      <div className="text-3xl font-bold text-secondary">
                        ${load.rate?.toLocaleString() || 'N/A'}
                      </div>
                      {ratePerMile && (
                        <div className="text-sm text-muted-foreground">
                          ${ratePerMile} per mile
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Pickup Date</div>
                      <div className="font-semibold">
                        {format(new Date(load.pickupDate), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  {isAuthenticated && load.weight && (
                    <div className="flex items-center gap-3">
                      <Weight className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Weight</div>
                        <div className="font-semibold">{load.weight.toLocaleString()} lbs</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                {isAuthenticated && (
                  <div className="border-t pt-6 space-y-3">
                    <h3 className="font-semibold text-lg">Contact Information</h3>
                    {load.contactName && (
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span>{load.contactName}</span>
                      </div>
                    )}
                    {load.contactPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <a href={`tel:${load.contactPhone}`} className="text-primary hover:underline">
                          {load.contactPhone}
                        </a>
                      </div>
                    )}
                    {load.contactEmail && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <a href={`mailto:${load.contactEmail}`} className="text-primary hover:underline">
                          {load.contactEmail}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {!isAuthenticated && (
                  <div className="border-t pt-6 text-center">
                    <p className="text-muted-foreground mb-4">
                      Login to view full details and contact information
                    </p>
                    <Button asChild>
                      <Link to="/auth">Login</Link>
                    </Button>
                  </div>
                )}

                {/* Generate Receiver Code for shipper's own loads */}
                {canGenerateReceiverCode && id && (
                  <div className="border-t pt-6">
                    <GenerateReceiverCode loadId={id} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Route Map</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoaded && !loadError && originCoords && destinationCoords ? (
                  <div className="border rounded-lg overflow-hidden">
                    <LoadMapWithRoute
                      origin={originCoords}
                      destination={destinationCoords}
                      onDistanceCalculated={() => {}}
                    />
                  </div>
                ) : (
                  <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Map not available</p>
                  </div>
                )}
                <div className="mt-4 text-xs text-muted-foreground">
                  Posted {format(new Date(load.postedDate), "MMM d 'at' h:mm a")}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadDetail;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck as TruckType } from "@/types/freight";
import { MapPin, Calendar, Truck, Phone, Mail, Radio, ArrowLeft, MessageSquare, Lock } from "lucide-react";
import { format } from "date-fns";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";

const TruckDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [truck, setTruck] = useState<TruckType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userRole } = useApprovalStatus();

  useEffect(() => {
    fetchTruck();
  }, [id]);

  const fetchTruck = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setTruck(data);
    } catch (error) {
      console.error("Error fetching truck:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const BlurredContent = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      <div className="blur-sm select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading truck details...</p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-semibold mb-2">Truck Not Found</h2>
              <p className="text-muted-foreground mb-4">This truck may have been removed or doesn't exist.</p>
              <Button onClick={() => navigate("/find-trucks")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Find Trucks
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isAuthenticated = !!user;
  const isOwnTruck = user?.id === truck.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid gap-6">
          {/* Main Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-primary" />
                    {truck.location}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <Radio className="h-4 w-4" />
                    <span>{truck.radius} mile radius</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {truck.equipment_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Availability */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Date</p>
                  <p className="font-semibold">{format(new Date(truck.available_date), "EEEE, MMMM d, yyyy")}</p>
                </div>
              </div>

              {/* Equipment */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Equipment Type</p>
                  <p className="font-semibold">{truck.equipment_type}</p>
                </div>
              </div>

              {/* Posted Date */}
              <p className="text-sm text-muted-foreground">
                Posted {format(new Date(truck.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{truck.contact_name}</p>
                      <a href={`tel:${truck.contact_phone}`} className="text-primary hover:underline">
                        {truck.contact_phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a href={`mailto:${truck.contact_email}`} className="text-primary hover:underline">
                        {truck.contact_email}
                      </a>
                    </div>
                  </div>

                  {/* Contact Button for Shippers */}
                  {userRole === "shipper" && !isOwnTruck && truck.user_id && (
                    <Button
                      className="w-full mt-4"
                      onClick={() => navigate(`/messages?with=${truck.user_id}`)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Carrier
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BlurredContent>
                    <div className="space-y-2">
                      <p className="font-semibold">John Doe</p>
                      <p>(555) 123-4567</p>
                      <p>carrier@example.com</p>
                    </div>
                  </BlurredContent>
                  <Button className="mt-4" onClick={() => navigate("/auth")}>
                    Login to View Contact Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TruckDetail;
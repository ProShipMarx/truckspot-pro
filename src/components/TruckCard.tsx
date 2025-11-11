import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Truck, Phone, Mail, Radio, Lock } from "lucide-react";
import { Truck as TruckType } from "@/types/freight";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface TruckCardProps {
  truck: TruckType;
  isAuthenticated: boolean;
}

const TruckCard = ({ truck, isAuthenticated }: TruckCardProps) => {
  const BlurredContent = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      <div className="blur-sm select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{truck.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Radio className="h-3 w-3" />
              <span>{truck.radius} mile radius</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Available {format(new Date(truck.available_date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            {isAuthenticated ? (
              <Badge variant="secondary">{truck.equipment_type}</Badge>
            ) : (
              <BlurredContent>
                <Badge variant="secondary">{truck.equipment_type}</Badge>
              </BlurredContent>
            )}
          </div>
        </div>
        
        {isAuthenticated ? (
          <div className="pt-3 border-t space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{truck.contact_name}</span>
              <span className="text-muted-foreground">•</span>
              <a href={`tel:${truck.contact_phone}`} className="text-primary hover:underline">
                {truck.contact_phone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${truck.contact_email}`} className="text-primary hover:underline">
                {truck.contact_email}
              </a>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t">
            <BlurredContent>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{truck.contact_name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{truck.contact_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{truck.contact_email}</span>
                </div>
              </div>
            </BlurredContent>
            <div className="mt-2 text-center">
              <Link to="/auth">
                <Button variant="outline" size="sm" className="w-full">
                  Login to View Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        {isAuthenticated ? (
          <>Posted {format(new Date(truck.created_at), "MMM d 'at' h:mm a")}</>
        ) : (
          <BlurredContent>
            Posted {format(new Date(truck.created_at), "MMM d 'at' h:mm a")}
          </BlurredContent>
        )}
      </CardFooter>
    </Card>
  );
};

export default TruckCard;

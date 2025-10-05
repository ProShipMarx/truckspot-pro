import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Weight, Truck, DollarSign, Phone, Mail } from "lucide-react";
import { Load } from "@/types/freight";
import { format } from "date-fns";

interface LoadCardProps {
  load: Load;
}

const LoadCard = ({ load }: LoadCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{load.origin}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">{load.destination}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {load.distance} miles
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-secondary">
              ${load.rate.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              ${(load.rate / load.distance).toFixed(2)}/mi
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(load.pickupDate), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-muted-foreground" />
            <span>{load.weight.toLocaleString()} lbs</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{load.equipmentType}</Badge>
          </div>
        </div>
        
        <div className="pt-3 border-t space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{load.contactName}</span>
            <span className="text-muted-foreground">•</span>
            <a href={`tel:${load.contactPhone}`} className="text-primary hover:underline">
              {load.contactPhone}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${load.contactEmail}`} className="text-primary hover:underline">
              {load.contactEmail}
            </a>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        Posted {format(new Date(load.postedDate), "MMM d 'at' h:mm a")}
      </CardFooter>
    </Card>
  );
};

export default LoadCard;

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Truck, Phone, Mail, Radio } from "lucide-react";
import { Truck as TruckType } from "@/types/freight";
import { format } from "date-fns";

interface TruckCardProps {
  truck: TruckType;
}

const TruckCard = ({ truck }: TruckCardProps) => {
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
            <span>Available {format(new Date(truck.availableDate), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary">{truck.equipmentType}</Badge>
          </div>
        </div>
        
        <div className="pt-3 border-t space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{truck.contactName}</span>
            <span className="text-muted-foreground">•</span>
            <a href={`tel:${truck.contactPhone}`} className="text-primary hover:underline">
              {truck.contactPhone}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${truck.contactEmail}`} className="text-primary hover:underline">
              {truck.contactEmail}
            </a>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        Posted {format(new Date(truck.postedDate), "MMM d 'at' h:mm a")}
      </CardFooter>
    </Card>
  );
};

export default TruckCard;

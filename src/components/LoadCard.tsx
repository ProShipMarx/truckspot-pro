import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Weight, Truck, DollarSign, Phone, Mail, Lock } from "lucide-react";
import { Load } from "@/types/freight";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface LoadCardProps {
  load: Load;
  isAuthenticated: boolean;
}

const LoadCard = ({ load, isAuthenticated }: LoadCardProps) => {
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
              <span className="font-semibold text-foreground">{load.origin}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold text-foreground">{load.destination}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {load.distance} miles
            </div>
          </div>
          <div className="text-right">
            {isAuthenticated ? (
              <>
                <div className="text-2xl font-bold text-secondary">
                  ${load.rate.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  ${(load.rate / load.distance).toFixed(2)}/mi
                </div>
              </>
            ) : (
              <BlurredContent>
                <div className="text-2xl font-bold text-secondary">
                  ${load.rate.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  ${(load.rate / load.distance).toFixed(2)}/mi
                </div>
              </BlurredContent>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(load.pickupDate), "MMM d, yyyy")}</span>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <span>{load.weight.toLocaleString()} lbs</span>
            </div>
          ) : (
            <BlurredContent>
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span>{load.weight.toLocaleString()} lbs</span>
              </div>
            </BlurredContent>
          )}
          <div className="flex items-center gap-2 col-span-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            {isAuthenticated ? (
              <Badge variant="outline">{load.equipmentType}</Badge>
            ) : (
              <BlurredContent>
                <Badge variant="outline">{load.equipmentType}</Badge>
              </BlurredContent>
            )}
          </div>
        </div>
        
        {isAuthenticated ? (
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
        ) : (
          <div className="pt-3 border-t">
            <BlurredContent>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{load.contactName}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{load.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{load.contactEmail}</span>
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
          <>Posted {format(new Date(load.postedDate), "MMM d 'at' h:mm a")}</>
        ) : (
          <BlurredContent>
            Posted {format(new Date(load.postedDate), "MMM d 'at' h:mm a")}
          </BlurredContent>
        )}
      </CardFooter>
    </Card>
  );
};

export default LoadCard;

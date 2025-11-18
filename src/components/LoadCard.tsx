import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Weight, Truck, DollarSign, Phone, Mail, Lock, Trash2, MessageSquare } from "lucide-react";
import { Load } from "@/types/freight";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useState } from "react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LoadCardProps {
  load: Load;
  isAuthenticated: boolean;
  userRole?: string | null;
  currentUserId?: string;
  onDelete?: () => void;
}

const LoadCard = ({ load, isAuthenticated, userRole, currentUserId, onDelete }: LoadCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const BlurredContent = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      <div className="blur-sm select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (userRole === 'admin') {
        // Admin users: call edge function to bypass RLS
        const { data, error } = await supabase.functions.invoke('admin-soft-delete', {
          body: { type: 'load', id: load.id }
        });

        if (error) {
          console.error('Error deleting load:', error);
          throw new Error(error.message || 'Failed to delete load');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to delete load');
        }
      } else {
        // Regular users: direct table update
        const { error } = await (supabase as any)
          .from('loads')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', load.id);

        if (error) {
          console.error('Error deleting load:', error);
          throw new Error(error.message || 'Failed to delete load');
        }
      }

      toast.success("Load deleted successfully");
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (error: any) {
      console.error('Error deleting load:', error);
      toast.error(error?.message || 'Failed to delete load');
    } finally {
      setIsDeleting(false);
    }
  };

  const ratePerMile = load.rate && load.distance ? (load.rate / load.distance).toFixed(2) : null;

  return (
    <>
      <Link to={`/loads/${load.id}`} className="block">
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer relative">
          {userRole === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{load.origin}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-foreground">{load.destination}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {load.distance ? `${load.distance} miles` : 'Distance not available'}
              </div>
            </div>
            <div className="text-right">
              {isAuthenticated ? (
                <>
                  <div className="text-2xl font-bold text-secondary">
                    ${load.rate?.toLocaleString() || 'N/A'}
                  </div>
                  {ratePerMile && (
                    <div className="text-xs text-muted-foreground">
                      ${ratePerMile}/mi
                    </div>
                  )}
                </>
              ) : (
                <BlurredContent>
                  <div className="text-2xl font-bold text-secondary">
                    ${load.rate?.toLocaleString() || 'N/A'}
                  </div>
                  {ratePerMile && (
                    <div className="text-xs text-muted-foreground">
                      ${ratePerMile}/mi
                    </div>
                  )}
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
          <div className="pt-3 border-t" onClick={(e) => e.preventDefault()}>
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
              <Link to="/auth" onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" className="w-full">
                  Login to View Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {isAuthenticated ? (
            <>Posted {format(new Date(load.postedDate), "MMM d 'at' h:mm a")}</>
          ) : (
            <BlurredContent>
              Posted {format(new Date(load.postedDate), "MMM d 'at' h:mm a")}
            </BlurredContent>
          )}
        </div>
        {isAuthenticated && userRole === "carrier" && currentUserId !== load.user_id && (
          <Link 
            to={`/messages?with=${load.user_id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/messages?with=${load.user_id}`;
            }}
          >
            <Button variant="outline" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact
            </Button>
          </Link>
        )}
      </CardFooter>
        </Card>
      </Link>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Load"
        description="Are you sure you want to delete this load? This action cannot be undone."
      />
    </>
  );
};

export default LoadCard;

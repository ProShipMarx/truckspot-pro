import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageSquare, Trash2, Building, Phone, Mail, Users } from "lucide-react";
import { format } from "date-fns";

const Favorites = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { favorites, isLoading: favoritesLoading, removeFavorite, refetch } = useFavorites(user?.id);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    setIsLoading(false);
  };

  const handleMessage = (userId: string) => {
    navigate(`/messages?with=${userId}`);
  };

  const handleRemove = async (userId: string) => {
    await removeFavorite(userId);
  };

  const shippers = favorites.filter(f => f.role === "shipper");
  const carriers = favorites.filter(f => f.role === "carrier");
  const others = favorites.filter(f => f.role !== "shipper" && f.role !== "carrier");

  if (isLoading || favoritesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const FavoriteCard = ({ favorite }: { favorite: typeof favorites[0] }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{favorite.role}</Badge>
              <span className="text-sm text-muted-foreground">
                Added {format(new Date(favorite.created_at), "MMM d, yyyy")}
              </span>
            </div>
            {favorite.profile?.company_name && (
              <div className="flex items-center gap-2 font-semibold">
                <Building className="h-4 w-4 text-muted-foreground" />
                {favorite.profile.company_name}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {favorite.profile?.email}
            </div>
            {favorite.profile?.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                {favorite.profile.phone}
              </div>
            )}
            {favorite.notes && (
              <p className="text-sm italic text-muted-foreground">"{favorite.notes}"</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMessage(favorite.favorited_user_id)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemove(favorite.favorited_user_id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
            <Heart className="h-8 w-8 text-destructive" />
            <h1 className="text-3xl font-bold">Favorites</h1>
          </div>
          <p className="text-muted-foreground">
            Users you've marked as favorites for quick access
          </p>
        </div>

        {favorites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding shippers or carriers to your favorites from load and truck posts
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => navigate("/find-loads")}>
                  Find Loads
                </Button>
                <Button variant="outline" onClick={() => navigate("/find-trucks")}>
                  Find Trucks
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">
                All ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="shippers">
                Shippers ({shippers.length})
              </TabsTrigger>
              <TabsTrigger value="carriers">
                Carriers ({carriers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {favorites.map(favorite => (
                <FavoriteCard key={favorite.id} favorite={favorite} />
              ))}
            </TabsContent>

            <TabsContent value="shippers" className="space-y-4">
              {shippers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No favorite shippers</p>
              ) : (
                shippers.map(favorite => (
                  <FavoriteCard key={favorite.id} favorite={favorite} />
                ))
              )}
            </TabsContent>

            <TabsContent value="carriers" className="space-y-4">
              {carriers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No favorite carriers</p>
              ) : (
                carriers.map(favorite => (
                  <FavoriteCard key={favorite.id} favorite={favorite} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Favorites;

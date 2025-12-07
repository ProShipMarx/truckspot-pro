import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FavoriteUser {
  id: string;
  favorited_user_id: string;
  created_at: string;
  notes: string | null;
  profile?: {
    id: string;
    email: string;
    company_name: string | null;
    phone: string | null;
  };
  role?: string;
}

export const useFavorites = (userId?: string) => {
  const [favorites, setFavorites] = useState<FavoriteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch favorites
      const { data: favoritesData, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (favoritesData && favoritesData.length > 0) {
        // Fetch profiles for favorited users
        const favoritedUserIds = favoritesData.map(f => f.favorited_user_id);
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, company_name, phone')
          .in('id', favoritedUserIds);

        // Fetch roles for favorited users
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', favoritedUserIds);

        // Combine data
        const enrichedFavorites = favoritesData.map(fav => ({
          ...fav,
          profile: profilesData?.find(p => p.id === fav.favorited_user_id),
          role: rolesData?.find(r => r.user_id === fav.favorited_user_id)?.role,
        }));

        setFavorites(enrichedFavorites);
        setFavoriteIds(new Set(favoritedUserIds));
      } else {
        setFavorites([]);
        setFavoriteIds(new Set());
      }
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (favoritedUserId: string, notes?: string) => {
    if (!userId) {
      toast.error("You must be logged in to add favorites");
      return false;
    }

    if (userId === favoritedUserId) {
      toast.error("You cannot favorite yourself");
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          favorited_user_id: favoritedUserId,
          notes: notes || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("Already in favorites");
        } else {
          throw error;
        }
        return false;
      }

      toast.success("Added to favorites");
      setFavoriteIds(prev => new Set([...prev, favoritedUserId]));
      fetchFavorites();
      return true;
    } catch (error: any) {
      console.error("Error adding favorite:", error);
      toast.error("Failed to add favorite");
      return false;
    }
  };

  const removeFavorite = async (favoritedUserId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('favorited_user_id', favoritedUserId);

      if (error) throw error;

      toast.success("Removed from favorites");
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(favoritedUserId);
        return newSet;
      });
      fetchFavorites();
      return true;
    } catch (error: any) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove favorite");
      return false;
    }
  };

  const toggleFavorite = async (favoritedUserId: string, notes?: string) => {
    if (favoriteIds.has(favoritedUserId)) {
      return removeFavorite(favoritedUserId);
    } else {
      return addFavorite(favoritedUserId, notes);
    }
  };

  const isFavorite = (favoritedUserId: string) => {
    return favoriteIds.has(favoritedUserId);
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};

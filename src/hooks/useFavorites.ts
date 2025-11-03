import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = (userId: string | undefined) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const fetchFavorites = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from("favorites")
      .select("car_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching favorites:", error);
      return;
    }

    setFavorites(new Set(data.map(f => f.car_id)));
  };

  const toggleFavorite = async (carId: string) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const isFavorite = favorites.has(carId);

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("car_id", carId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove favorite",
          variant: "destructive",
        });
      } else {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(carId);
          return newSet;
        });
        toast({
          title: "Removed from favorites",
        });
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, car_id: carId });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add favorite",
          variant: "destructive",
        });
      } else {
        setFavorites(prev => new Set(prev).add(carId));
        toast({
          title: "Added to favorites",
        });
      }
    }

    setLoading(false);
  };

  return { favorites, toggleFavorite, loading };
};

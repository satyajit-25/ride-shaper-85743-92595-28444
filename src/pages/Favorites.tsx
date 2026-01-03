import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Heart, Scale } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";

interface Car {
  id: string;
  name: string;
  brand: string;
  price_lakhs: number;
  mileage_kmpl?: number;
  fuel_type: string;
  type: string;
  image_url?: string;
  features?: string[];
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites(user?.id);
  const { toast } = useToast();
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([]);
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteCars = async () => {
      const favoriteIds = Array.from(favorites);
      if (!user || favoriteIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .in("id", favoriteIds);

        if (error) throw error;
        setFavoriteCars(data || []);
      } catch (error) {
        console.error("Error fetching favorite cars:", error);
        toast({
          title: "Error",
          description: "Failed to load favorite cars",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteCars();
  }, [user, favorites, toast]);

  const handleToggleSelection = (carId: string) => {
    setSelectedCars(prev => 
      prev.includes(carId) 
        ? prev.filter(id => id !== carId)
        : [...prev, carId]
    );
  };

  const handleCompare = () => {
    if (selectedCars.length < 2) {
      toast({
        title: "Select at least 2 cars",
        description: "Please select at least 2 cars to compare",
        variant: "destructive",
      });
      return;
    }

    const carsToCompare = favoriteCars.filter(car => selectedCars.includes(car.id));
    navigate("/compare-financing", { state: { selectedCars: carsToCompare } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/find-car")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Favorite Cars</h1>
                <p className="text-sm text-muted-foreground">
                  {favoriteCars.length} car{favoriteCars.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedCars.length > 0 && (
                <Button onClick={handleCompare}>
                  <Scale className="w-4 h-4 mr-2" />
                  Compare ({selectedCars.length})
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {favoriteCars.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start adding cars to your favorites to see them here
            </p>
            <Button onClick={() => navigate("/find-car")}>
              Find Cars
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Select cars to compare their financing options side by side
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteCars.map((car) => (
                <Card key={car.id} className="overflow-hidden">
                  <div className="relative">
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt={car.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => toggleFavorite(car.id)}
                        className="bg-background/80 backdrop-blur-sm hover:bg-accent/40 hover:text-red-600 transition-all"
                      >
                        <Heart className="w-4 h-4 fill-destructive text-destructive" />
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedCars.includes(car.id)}
                        onCheckedChange={() => handleToggleSelection(car.id)}
                        className="bg-background/80 backdrop-blur-sm border-2"
                      />
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{car.name}</h3>
                      <p className="text-sm text-muted-foreground">{car.brand}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {car.type}
                      </span>
                      <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {car.fuel_type}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold">₹{car.price_lakhs.toFixed(2)}L</span>
                      </div>
                      {car.mileage_kmpl && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mileage:</span>
                          <span className="font-semibold">{car.mileage_kmpl} km/l</span>
                        </div>
                      )}
                    </div>

                    {car.features && car.features.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Key Features:</p>
                        <div className="flex flex-wrap gap-1">
                          {car.features.slice(0, 3).map((feature, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                          {car.features.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{car.features.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;

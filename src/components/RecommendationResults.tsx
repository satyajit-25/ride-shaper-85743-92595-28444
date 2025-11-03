import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ExternalLink, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
import FinancingCalculator from "./FinancingCalculator";
import { cn } from "@/lib/utils";

interface Recommendation {
  car: {
    id: string;
    name: string;
    brand: string;
    type: string;
    fuel_type: string;
    price_lakhs: number;
    mileage_kmpl: number;
    description: string;
    features: string[];
    image_url?: string;
  };
  explanation: string;
  rank: number;
}

interface Props {
  recommendations: Recommendation[];
}

const RecommendationResults = ({ recommendations }: Props) => {
  const { user } = useAuth();
  const { favorites, toggleFavorite, loading } = useFavorites(user?.id);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 text-2xl font-bold">
        <Sparkles className="text-primary" />
        <h2>Your Top 4 Perfect Matches</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {recommendations.map((rec) => (
          <Card 
            key={rec.car.name} 
            className="overflow-hidden hover:shadow-xl transition-shadow"
          >
            {rec.car.image_url && (
              <a 
                href={`https://www.zigwheels.com/search/?q=${encodeURIComponent(rec.car.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-64 overflow-hidden hover:opacity-90 transition-opacity"
              >
                <img 
                  src={rec.car.image_url} 
                  alt={`${rec.car.brand} ${rec.car.name}`}
                  className="w-full h-full object-cover"
                />
              </a>
            )}
            <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{rec.car.name}</CardTitle>
                  <p className="text-muted-foreground">{rec.car.brand}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleFavorite(rec.car.id)}
                    disabled={loading}
                    className={cn(
                      "transition-colors",
                      favorites.has(rec.car.id) && "text-red-500 hover:text-red-600"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", favorites.has(rec.car.id) && "fill-current")} />
                  </Button>
                  <Badge className="text-lg">#{rec.rank}</Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold">{rec.car.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuel</p>
                  <p className="font-semibold">{rec.car.fuel_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-semibold text-primary">₹{rec.car.price_lakhs}L</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mileage</p>
                  <p className="font-semibold">{rec.car.mileage_kmpl} km/l</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Features</p>
                <div className="flex flex-wrap gap-2">
                  {rec.car.features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Recommendation
                </p>
                <p className="text-sm leading-relaxed">{rec.explanation}</p>
              </div>

              <div className="mt-4 space-y-2">
                <FinancingCalculator carPrice={rec.car.price_lakhs} carName={rec.car.name} />
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <a
                    href={`https://www.zigwheels.com/search/?q=${encodeURIComponent(rec.car.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    View on ZigWheels
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecommendationResults;

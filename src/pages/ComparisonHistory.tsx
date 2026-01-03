import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2, ExternalLink, History } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ComparisonHistory {
  id: string;
  comparison_name: string | null;
  car_ids: string[];
  financing_params: {
    downPayment: number;
    interestRate: number;
    loanTenure: number;
  };
  created_at: string;
}

interface Car {
  id: string;
  name: string;
  brand: string;
  price_lakhs: number;
  mileage_kmpl?: number;
  fuel_type: string;
  type: string;
  image_url?: string;
}

const ComparisonHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<ComparisonHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [carDetails, setCarDetails] = useState<Record<string, Car>>({});

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("comparison_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setHistory((data || []) as unknown as ComparisonHistory[]);

      // Fetch car details for all comparisons
      const allCarIds = Array.from(
        new Set(data?.flatMap(h => h.car_ids) || [])
      );

      if (allCarIds.length > 0) {
        const { data: carsData, error: carsError } = await supabase
          .from("cars")
          .select("*")
          .in("id", allCarIds);

        if (carsError) throw carsError;

        const carsMap = (carsData || []).reduce((acc, car) => {
          acc[car.id] = car;
          return acc;
        }, {} as Record<string, Car>);

        setCarDetails(carsMap);
      }
    } catch (error) {
      console.error("Error fetching comparison history:", error);
      toast({
        title: "Error",
        description: "Failed to load comparison history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteComparison = async (id: string) => {
    try {
      const { error } = await supabase
        .from("comparison_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comparison deleted successfully",
      });

      fetchHistory();
    } catch (error) {
      console.error("Error deleting comparison:", error);
      toast({
        title: "Error",
        description: "Failed to delete comparison",
        variant: "destructive",
      });
    }
  };

  const reopenComparison = (comparison: ComparisonHistory) => {
    const selectedCars = comparison.car_ids
      .map(id => carDetails[id])
      .filter(Boolean);

    if (selectedCars.length === 0) {
      toast({
        title: "Error",
        description: "Some cars in this comparison are no longer available",
        variant: "destructive",
      });
      return;
    }

    navigate("/compare-financing", {
      state: { selectedCars },
    });
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
                <h1 className="text-2xl font-bold">Comparison History</h1>
                <p className="text-sm text-muted-foreground">
                  {history.length} saved comparison{history.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {history.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No comparison history</h2>
            <p className="text-muted-foreground mb-6">
              Your saved comparisons will appear here
            </p>
            <Button onClick={() => navigate("/favorites")}>
              Start Comparing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => {
              const cars = item.car_ids
                .map(id => carDetails[id])
                .filter(Boolean);

              return (
                <Card key={item.id} className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold mb-2">
                      {item.comparison_name || "Unnamed Comparison"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()} at{" "}
                      {new Date(item.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Cars ({cars.length}):</p>
                    <div className="space-y-1">
                      {cars.slice(0, 3).map((car) => (
                        <div key={car.id} className="text-sm text-muted-foreground">
                          • {car.name}
                        </div>
                      ))}
                      {cars.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{cars.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Down Payment:</span>
                      <span className="font-semibold">
                        {item.financing_params.downPayment}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <span className="font-semibold">
                        {item.financing_params.interestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Loan Tenure:</span>
                      <span className="font-semibold">
                        {item.financing_params.loanTenure} years
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => reopenComparison(item)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteComparison(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonHistory;

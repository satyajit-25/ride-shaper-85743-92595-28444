import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trash2, Eye, Calendar } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FinancingParams {
  downPayment: number;
  interestRate: number;
  loanTenure: number;
}

interface ComparisonHistory {
  id: string;
  comparison_name: string;
  car_ids: string[];
  financing_params: FinancingParams | any;
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
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory((data || []) as ComparisonHistory[]);
    } catch (error) {
      console.error("Error fetching history:", error);
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
        title: "Deleted",
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

  const viewComparison = async (comparison: ComparisonHistory) => {
    try {
      // Fetch car details
      const { data: cars, error } = await supabase
        .from("cars")
        .select("*")
        .in("id", comparison.car_ids);

      if (error) throw error;

      // Navigate to comparison page with the saved data
      navigate("/compare-financing", {
        state: {
          selectedCars: cars,
          savedParams: comparison.financing_params,
        },
      });
    } catch (error) {
      console.error("Error loading comparison:", error);
      toast({
        title: "Error",
        description: "Failed to load comparison",
        variant: "destructive",
      });
    }
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
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No saved comparisons</h2>
            <p className="text-muted-foreground mb-6">
              Your saved car comparisons will appear here
            </p>
            <Button onClick={() => navigate("/favorites")}>
              Start Comparing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((comparison) => (
              <Card key={comparison.id} className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {comparison.comparison_name || "Untitled Comparison"}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(comparison.created_at), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cars Compared:</span>
                    <span className="font-semibold">{comparison.car_ids.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment:</span>
                    <span className="font-semibold">
                      {comparison.financing_params.downPayment}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span className="font-semibold">
                      {comparison.financing_params.interestRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Tenure:</span>
                    <span className="font-semibold">
                      {comparison.financing_params.loanTenure} years
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => viewComparison(comparison)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteComparison(comparison.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonHistory;

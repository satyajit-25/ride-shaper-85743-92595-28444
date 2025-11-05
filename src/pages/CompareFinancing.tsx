import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Save, History } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface FinancingParams {
  downPayment: number;
  interestRate: number;
  loanTenure: number;
}

const CompareFinancing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [financingParams, setFinancingParams] = useState<FinancingParams>({
    downPayment: 20, // percentage
    interestRate: 8.5,
    loanTenure: 5,
  });
  const [comparisonName, setComparisonName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const cars = location.state?.selectedCars as Car[];
    const savedParams = location.state?.savedParams as FinancingParams;
    
    if (!cars || cars.length === 0) {
      navigate("/find-car");
      return;
    }
    
    setSelectedCars(cars);
    if (savedParams) {
      setFinancingParams(savedParams);
    }
  }, [location.state, navigate]);

  const calculateFinancing = (carPrice: number) => {
    const carPriceInRupees = carPrice * 100000;
    const downPaymentAmount = (carPrice * financingParams.downPayment) / 100;
    const downPaymentInRupees = downPaymentAmount * 100000;
    const loanAmount = Math.max(0, carPriceInRupees - downPaymentInRupees);
    const monthlyRate = Math.max(0, financingParams.interestRate) / 12 / 100;
    const numPayments = Math.max(1, financingParams.loanTenure) * 12;
    
    const emi = loanAmount > 0 && monthlyRate > 0
      ? loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments;
    
    const totalAmount = emi * numPayments;
    const totalInterest = totalAmount - loanAmount;

    return {
      downPaymentAmount,
      loanAmount: loanAmount / 100000,
      emi: emi / 100000,
      totalInterest: totalInterest / 100000,
      totalAmount: totalAmount / 100000,
    };
  };

  const removeCar = (carId: string) => {
    const updatedCars = selectedCars.filter(car => car.id !== carId);
    if (updatedCars.length === 0) {
      navigate("/find-car");
      return;
    }
    setSelectedCars(updatedCars);
  };

  const handleSaveComparison = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to save comparisons",
        variant: "destructive",
      });
      return;
    }

    if (!comparisonName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this comparison",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("comparison_history").insert([{
        user_id: user.id,
        comparison_name: comparisonName,
        car_ids: selectedCars.map(car => car.id),
        financing_params: financingParams as any,
      }]);

      if (error) throw error;

      toast({
        title: "Comparison saved",
        description: "You can view it in your comparison history",
      });
      setIsSaveDialogOpen(false);
      setComparisonName("");
    } catch (error) {
      console.error("Error saving comparison:", error);
      toast({
        title: "Error",
        description: "Failed to save comparison",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare chart data
  const priceChartData = selectedCars.map(car => ({
    name: car.name.length > 15 ? car.name.substring(0, 15) + "..." : car.name,
    price: car.price_lakhs,
    mileage: car.mileage_kmpl || 0,
  }));

  const financingChartData = selectedCars.map(car => {
    const financing = calculateFinancing(car.price_lakhs);
    return {
      name: car.name.length > 15 ? car.name.substring(0, 15) + "..." : car.name,
      emi: financing.emi,
      interest: financing.totalInterest,
      total: financing.totalAmount,
    };
  });

  const radarChartData = selectedCars.map(car => {
    const financing = calculateFinancing(car.price_lakhs);
    return {
      car: car.name.length > 12 ? car.name.substring(0, 12) + "..." : car.name,
      Price: car.price_lakhs,
      Mileage: car.mileage_kmpl || 0,
      EMI: financing.emi,
    };
  });

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
                <h1 className="text-2xl font-bold">Compare Financing Options</h1>
                <p className="text-sm text-muted-foreground">
                  Comparing {selectedCars.length} car{selectedCars.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/comparison-history")}
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Comparison</DialogTitle>
                    <DialogDescription>
                      Give this comparison a name to save it for later reference
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="comparison-name">Comparison Name</Label>
                    <Input
                      id="comparison-name"
                      value={comparisonName}
                      onChange={(e) => setComparisonName(e.target.value)}
                      placeholder="e.g., Budget SUVs Comparison"
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsSaveDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveComparison} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Global Financing Parameters */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Financing Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="downPayment">Down Payment (%)</Label>
              <Input
                id="downPayment"
                type="number"
                step="1"
                value={financingParams.downPayment}
                onChange={(e) => setFinancingParams(prev => ({ 
                  ...prev, 
                  downPayment: Math.max(0, Math.min(100, Number(e.target.value)))
                }))}
                min={0}
                max={100}
              />
            </div>
            <div>
              <Label htmlFor="interestRate">Interest Rate (% per annum)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={financingParams.interestRate}
                onChange={(e) => setFinancingParams(prev => ({ 
                  ...prev, 
                  interestRate: Number(e.target.value)
                }))}
                min={0.1}
                max={30}
              />
            </div>
            <div>
              <Label htmlFor="loanTenure">Loan Tenure (Years)</Label>
              <Input
                id="loanTenure"
                type="number"
                step="1"
                value={financingParams.loanTenure}
                onChange={(e) => setFinancingParams(prev => ({ 
                  ...prev, 
                  loanTenure: Number(e.target.value)
                }))}
                min={1}
                max={10}
              />
            </div>
          </div>
        </Card>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedCars.map((car) => {
            const financing = calculateFinancing(car.price_lakhs);
            
            return (
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
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeCar(car.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{car.name}</h3>
                    <p className="text-sm text-muted-foreground">{car.brand}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {car.type}
                      </span>
                      <span className="text-sm bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {car.fuel_type}
                      </span>
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Car Price</p>
                    <p className="text-2xl font-bold">₹{car.price_lakhs.toFixed(2)}L</p>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Down Payment:</span>
                      <span className="font-semibold">
                        ₹{financing.downPaymentAmount.toFixed(2)}L
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Loan Amount:</span>
                      <span className="font-semibold">₹{financing.loanAmount.toFixed(2)}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly EMI:</span>
                      <span className="font-bold text-primary text-lg">
                        ₹{financing.emi.toFixed(2)}L
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Interest:</span>
                      <span className="font-semibold">
                        ₹{financing.totalInterest.toFixed(2)}L
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-primary">
                        ₹{financing.totalAmount.toFixed(2)}L
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Visual Charts Section */}
        <div className="mt-8 space-y-8">
          {/* Price & Mileage Comparison */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Price & Mileage Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="price" fill="hsl(var(--primary))" name="Price (Lakhs)" />
                <Bar yAxisId="right" dataKey="mileage" fill="hsl(var(--secondary))" name="Mileage (km/l)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Financing Breakdown */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Financing Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={financingChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Legend />
                <Bar dataKey="emi" fill="hsl(var(--primary))" name="Monthly EMI (Lakhs)" />
                <Bar dataKey="interest" fill="hsl(var(--destructive))" name="Total Interest (Lakhs)" />
                <Bar dataKey="total" fill="hsl(var(--secondary))" name="Total Amount (Lakhs)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar Comparison */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Overall Comparison</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarChartData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="car" className="text-xs" />
                <PolarRadiusAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Legend />
                <Radar name="Price (Lakhs)" dataKey="Price" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Radar name="Mileage (km/l)" dataKey="Mileage" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                <Radar name="EMI (Lakhs)" dataKey="EMI" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-semibold mb-4">Comparison Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Car</th>
                  <th className="text-right py-2 px-4">Price</th>
                  <th className="text-right py-2 px-4">Monthly EMI</th>
                  <th className="text-right py-2 px-4">Total Interest</th>
                  <th className="text-right py-2 px-4">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedCars.map((car) => {
                  const financing = calculateFinancing(car.price_lakhs);
                  return (
                    <tr key={car.id} className="border-b">
                      <td className="py-3 px-4 font-medium">{car.name}</td>
                      <td className="text-right py-3 px-4">₹{car.price_lakhs.toFixed(2)}L</td>
                      <td className="text-right py-3 px-4 font-semibold text-primary">
                        ₹{financing.emi.toFixed(2)}L
                      </td>
                      <td className="text-right py-3 px-4">₹{financing.totalInterest.toFixed(2)}L</td>
                      <td className="text-right py-3 px-4 font-bold">
                        ₹{financing.totalAmount.toFixed(2)}L
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompareFinancing;

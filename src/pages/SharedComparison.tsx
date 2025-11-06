import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

interface ComparisonData {
  id: string;
  comparison_name: string | null;
  car_ids: string[];
  financing_params: FinancingParams;
  created_at: string;
}

const SharedComparison = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    fetchSharedComparison();
  }, [id, navigate]);

  const fetchSharedComparison = async () => {
    try {
      const { data: comparisonData, error: comparisonError } = await supabase
        .from("comparison_history")
        .select("*")
        .eq("id", id)
        .single();

      if (comparisonError) throw comparisonError;

      setComparison(comparisonData as unknown as ComparisonData);

      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*")
        .in("id", comparisonData.car_ids);

      if (carsError) throw carsError;

      setCars(carsData || []);
    } catch (error) {
      console.error("Error fetching shared comparison:", error);
      toast({
        title: "Error",
        description: "Failed to load comparison. It may be private or deleted.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancing = (carPrice: number) => {
    if (!comparison) return { downPaymentAmount: 0, loanAmount: 0, emi: 0, totalInterest: 0, totalAmount: 0 };
    
    const carPriceInRupees = carPrice * 100000;
    const downPaymentAmount = (carPrice * comparison.financing_params.downPayment) / 100;
    const downPaymentInRupees = downPaymentAmount * 100000;
    const loanAmount = Math.max(0, carPriceInRupees - downPaymentInRupees);
    const monthlyRate = Math.max(0, comparison.financing_params.interestRate) / 12 / 100;
    const numPayments = Math.max(1, comparison.financing_params.loanTenure) * 12;
    
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const priceChartData = cars.map(car => ({
    name: car.name.length > 15 ? car.name.substring(0, 15) + '...' : car.name,
    price: car.price_lakhs,
    emi: calculateFinancing(car.price_lakhs).emi,
  }));

  const mileageChartData = cars
    .filter(car => car.mileage_kmpl)
    .map(car => ({
      name: car.name.length > 15 ? car.name.substring(0, 15) + '...' : car.name,
      mileage: car.mileage_kmpl,
    }));

  const totalCostData = cars.map(car => {
    const financing = calculateFinancing(car.price_lakhs);
    return {
      name: car.name.length > 15 ? car.name.substring(0, 15) + '...' : car.name,
      downPayment: financing.downPaymentAmount,
      loanAmount: financing.loanAmount,
      interest: financing.totalInterest,
    };
  });

  const fuelTypeData = cars.reduce((acc, car) => {
    const existing = acc.find(item => item.name === car.fuel_type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: car.fuel_type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {comparison.comparison_name || "Shared Comparison"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Comparing {cars.length} car{cars.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Financing Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Down Payment</p>
              <p className="text-2xl font-bold">{comparison.financing_params.downPayment}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p className="text-2xl font-bold">{comparison.financing_params.interestRate}% p.a.</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loan Tenure</p>
              <p className="text-2xl font-bold">{comparison.financing_params.loanTenure} years</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Price & EMI Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="price" fill="hsl(var(--primary))" name="Price (₹L)" />
                <Bar dataKey="emi" fill="hsl(var(--secondary))" name="Monthly EMI (₹L)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {mileageChartData.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Mileage Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mileageChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="mileage" fill="hsl(var(--accent))" name="Mileage (km/l)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Total Cost Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={totalCostData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="downPayment" stackId="a" fill="hsl(var(--primary))" name="Down Payment (₹L)" />
                <Bar dataKey="loanAmount" stackId="a" fill="hsl(var(--secondary))" name="Loan Amount (₹L)" />
                <Bar dataKey="interest" stackId="a" fill="hsl(var(--destructive))" name="Total Interest (₹L)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Fuel Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fuelTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {fuelTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => {
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
                {cars.map((car) => {
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

export default SharedComparison;

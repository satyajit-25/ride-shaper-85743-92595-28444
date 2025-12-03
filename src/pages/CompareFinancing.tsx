import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Save, History, Download, Share2, Mail, MessageCircle, Link2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [savedComparisonId, setSavedComparisonId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cars = location.state?.selectedCars as Car[];
    if (!cars || cars.length === 0) {
      navigate("/find-car");
      return;
    }
    setSelectedCars(cars);
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

  const saveComparison = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save comparisons",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("comparison_history")
        .insert({
          user_id: user.id,
          comparison_name: comparisonName || `Comparison on ${new Date().toLocaleDateString()}`,
          car_ids: selectedCars.map(car => car.id),
          financing_params: financingParams as any,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedComparisonId(data.id);
      toast({
        title: "Success",
        description: "Comparison saved successfully",
      });
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

  const exportToPDF = async () => {
    if (!contentRef.current) return;

    setIsExporting(true);
    try {
      // Always export in light mode for better readability
      const backgroundColor = '#ffffff';
      const textColor = '#1a1a2e';

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: backgroundColor,
        windowWidth: 1200, // Fixed width for consistent PDF layout
        onclone: (clonedDoc) => {
          const root = clonedDoc.documentElement;
          // Force light mode colors for PDF
          root.classList.remove('dark');
          root.style.setProperty('--background', '0 0% 100%');
          root.style.setProperty('--foreground', '222.2 84% 4.9%');
          root.style.setProperty('--card', '0 0% 100%');
          root.style.setProperty('--card-foreground', '222.2 84% 4.9%');
          root.style.setProperty('--muted', '210 40% 96%');
          root.style.setProperty('--muted-foreground', '215.4 16.3% 46.9%');
          root.style.setProperty('--border', '214.3 31.8% 91.4%');
          
          // Hide interactive elements in PDF
          const buttons = clonedDoc.querySelectorAll('button');
          buttons.forEach(btn => {
            (btn as HTMLElement).style.display = 'none';
          });
          
          // Hide input fields
          const inputs = clonedDoc.querySelectorAll('input');
          inputs.forEach(input => {
            (input as HTMLElement).style.display = 'none';
          });
          
          // Hide labels for inputs
          const labels = clonedDoc.querySelectorAll('label');
          labels.forEach(label => {
            (label as HTMLElement).style.display = 'none';
          });
          
          // Style the content for print
          const container = clonedDoc.querySelector('[data-pdf-content]');
          if (container) {
            (container as HTMLElement).style.backgroundColor = backgroundColor;
            (container as HTMLElement).style.color = textColor;
            (container as HTMLElement).style.padding = '20px';
          }
        }
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape", // Better for comparison tables
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 10;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      pdf.save(`car-comparison-${new Date().getTime()}.pdf`);
      
      toast({
        title: "Success",
        description: "Comparison exported to PDF",
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export comparison",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getShareUrl = async (): Promise<string | null> => {
    if (!savedComparisonId) {
      toast({
        title: "Info",
        description: "Please save the comparison first to share it",
      });
      return null;
    }

    // Update the comparison to be publicly accessible
    const { error: updateError } = await supabase
      .from("comparison_history")
      .update({ is_public: true })
      .eq("id", savedComparisonId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to make comparison shareable",
        variant: "destructive",
      });
      return null;
    }

    return `${window.location.origin}/shared-comparison/${savedComparisonId}`;
  };

  const shareViaWhatsApp = async () => {
    const url = await getShareUrl();
    if (url) {
      const text = `Check out this car comparison: ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const shareViaEmail = async () => {
    const url = await getShareUrl();
    if (url) {
      const subject = comparisonName || "Car Financing Comparison";
      const body = `Hi,\n\nI wanted to share this car comparison with you:\n\n${url}\n\nBest regards`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  const copyShareLink = async () => {
    const url = await getShareUrl();
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Share link has been copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Share Link",
          description: url,
        });
      }
    }
  };

  const shareNative = async () => {
    const url = await getShareUrl();
    if (url && navigator.share) {
      try {
        await navigator.share({
          title: comparisonName || "Car Financing Comparison",
          text: "Check out this car comparison",
          url: url,
        });
      } catch (error) {
        // User cancelled or error
      }
    }
  };

  // Prepare chart data
  const priceChartData = selectedCars.map(car => ({
    name: car.name.length > 15 ? car.name.substring(0, 15) + '...' : car.name,
    price: car.price_lakhs,
    emi: calculateFinancing(car.price_lakhs).emi,
  }));

  const mileageChartData = selectedCars
    .filter(car => car.mileage_kmpl)
    .map(car => ({
      name: car.name.length > 15 ? car.name.substring(0, 15) + '...' : car.name,
      mileage: car.mileage_kmpl,
    }));

  const totalCostData = selectedCars.map(car => {
    const financing = calculateFinancing(car.price_lakhs);
    return {
      name: car.name.length > 15 ? car.name.substring(0, 15) + '...' : car.name,
      downPayment: financing.downPaymentAmount,
      loanAmount: financing.loanAmount,
      interest: financing.totalInterest,
    };
  });

  const fuelTypeData = selectedCars.reduce((acc, car) => {
    const existing = acc.find(item => item.name === car.fuel_type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: car.fuel_type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - excluded from PDF */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
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
                onClick={exportToPDF}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export PDF"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!savedComparisonId}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={shareViaWhatsApp} className="cursor-pointer">
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={shareViaEmail} className="cursor-pointer">
                    <Mail className="w-4 h-4 mr-2 text-blue-500" />
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyShareLink} className="cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <DropdownMenuItem onClick={shareNative} className="cursor-pointer">
                      <Link2 className="w-4 h-4 mr-2" />
                      More Options
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                onClick={() => navigate("/comparison-history")}
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Content Area */}
      <div ref={contentRef} data-pdf-content className="bg-background">
        {/* PDF Header - only visible in PDF */}
        <div className="hidden print:block p-6 border-b mb-6">
          <h1 className="text-3xl font-bold text-center">Car Financing Comparison</h1>
          <p className="text-center text-muted-foreground mt-2">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Save Comparison - hidden in PDF */}
          <Card className="p-6 mb-6 print:hidden">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="comparisonName">Comparison Name (optional)</Label>
                <Input
                  id="comparisonName"
                  placeholder="e.g., Budget SUV comparison"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={saveComparison} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Comparison"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Financing Parameters - Show values only in PDF */}
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Financing Parameters</h2>
            
            {/* Interactive inputs - hidden in PDF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
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
            
            {/* Static display for PDF */}
            <div className="hidden print:grid grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Down Payment</p>
                <p className="text-2xl font-bold">{financingParams.downPayment}%</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-2xl font-bold">{financingParams.interestRate}% p.a.</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Loan Tenure</p>
                <p className="text-2xl font-bold">{financingParams.loanTenure} Years</p>
              </div>
            </div>
          </Card>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Price & EMI Comparison Chart */}
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

          {/* Mileage Comparison Chart */}
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

          {/* Total Cost Breakdown */}
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

          {/* Fuel Type Distribution */}
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
    </div>
  );
};

export default CompareFinancing;

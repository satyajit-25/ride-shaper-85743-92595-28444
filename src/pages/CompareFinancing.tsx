import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Save, History, Download, Share2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts";
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
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Custom active shape for donut chart hover effect
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 5}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))', transition: 'all 0.3s ease' }}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 5}
          outerRadius={innerRadius - 2}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text x={cx} y={cy - 10} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={18} fontWeight="bold">
          {payload.name}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={14}>
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

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

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!contentRef.current) return null;

    // Create a dedicated PDF content element
    const pdfContent = document.createElement('div');
    pdfContent.style.width = '1100px';
    pdfContent.style.padding = '40px';
    pdfContent.style.backgroundColor = '#ffffff';
    pdfContent.style.color = '#1a1a2e';
    pdfContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Build PDF content manually for better control
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #1a1a2e;">Car Financing Comparison</h1>
        <p style="color: #6b7280; margin-top: 8px; font-size: 14px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="display: flex; gap: 20px; margin-bottom: 30px; justify-content: center;">
        <div style="background: #f3f4f6; padding: 16px 24px; border-radius: 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Down Payment</p>
          <p style="font-size: 20px; font-weight: bold; margin: 4px 0 0 0; color: #1a1a2e;">${financingParams.downPayment}%</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; border-radius: 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Interest Rate</p>
          <p style="font-size: 20px; font-weight: bold; margin: 4px 0 0 0; color: #1a1a2e;">${financingParams.interestRate}% p.a.</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; border-radius: 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Loan Tenure</p>
          <p style="font-size: 20px; font-weight: bold; margin: 4px 0 0 0; color: #1a1a2e;">${financingParams.loanTenure} Years</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="text-align: left; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;">Car</th>
            <th style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;">Price</th>
            <th style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;">Down Payment</th>
            <th style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;">Loan Amount</th>
            <th style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;">Monthly EMI</th>
            <th style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;">Total Interest</th>
            <th style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${selectedCars.map((car) => {
            const financing = calculateFinancing(car.price_lakhs);
            return `
              <tr>
                <td style="padding: 12px 16px; border: 1px solid #e5e7eb;">
                  <div style="font-weight: 600;">${car.name}</div>
                  <div style="color: #6b7280; font-size: 12px;">${car.brand} • ${car.type} • ${car.fuel_type}</div>
                </td>
                <td style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 500;">₹${car.price_lakhs.toFixed(2)}L</td>
                <td style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb;">₹${financing.downPaymentAmount.toFixed(2)}L</td>
                <td style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb;">₹${financing.loanAmount.toFixed(2)}L</td>
                <td style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600; color: #7c3aed;">₹${financing.emi.toFixed(2)}L</td>
                <td style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb;">₹${financing.totalInterest.toFixed(2)}L</td>
                <td style="text-align: right; padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 700;">₹${financing.totalAmount.toFixed(2)}L</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="display: grid; grid-template-columns: repeat(${Math.min(selectedCars.length, 3)}, 1fr); gap: 20px;">
        ${selectedCars.map((car) => {
          const financing = calculateFinancing(car.price_lakhs);
          return `
            <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 16px; color: white;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${car.name}</h3>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">${car.brand}</p>
              </div>
              <div style="padding: 16px;">
                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                  <span style="background: #f3e8ff; color: #7c3aed; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${car.type}</span>
                  <span style="background: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${car.fuel_type}</span>
                </div>
                <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <p style="margin: 0; color: #6b7280; font-size: 11px;">Car Price</p>
                  <p style="margin: 4px 0 0 0; font-size: 22px; font-weight: bold; color: #1a1a2e;">₹${car.price_lakhs.toFixed(2)}L</p>
                </div>
                <div style="font-size: 13px;">
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #6b7280;">Monthly EMI:</span>
                    <span style="font-weight: 600; color: #7c3aed;">₹${financing.emi.toFixed(2)}L</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #6b7280;">Total Interest:</span>
                    <span style="font-weight: 500;">₹${financing.totalInterest.toFixed(2)}L</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                    <span style="font-weight: 500;">Total Amount:</span>
                    <span style="font-weight: 700; color: #1a1a2e;">₹${financing.totalAmount.toFixed(2)}L</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px;">
        Generated by AI Car Finder • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
      </div>
    `;

    document.body.appendChild(pdfContent);

    try {
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
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

      return pdf.output('blob');
    } catch (error) {
      document.body.removeChild(pdfContent);
      throw error;
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const blob = await generatePDFBlob();
      if (!blob) throw new Error('Failed to generate PDF');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `car-comparison-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
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

  const sharePDF = async () => {
    setIsExporting(true);
    try {
      const blob = await generatePDFBlob();
      if (!blob) throw new Error('Failed to generate PDF');

      const fileName = `car-comparison-${new Date().getTime()}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // Check if native sharing with files is supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: comparisonName || 'Car Financing Comparison',
        });
        toast({
          title: "Success",
          description: "PDF shared successfully",
        });
      } else {
        // Fallback: download the PDF first
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Open email client with instructions
        const subject = encodeURIComponent(comparisonName || 'Car Financing Comparison');
        const body = encodeURIComponent('Please find the car financing comparison PDF attached.\n\n(Attach the downloaded PDF file to this email)');
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        
        toast({
          title: "PDF Downloaded",
          description: "Email client opened. Please attach the downloaded PDF to share.",
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error sharing PDF:", error);
        toast({
          title: "Error",
          description: "Failed to share PDF",
          variant: "destructive",
        });
      }
    } finally {
      setIsExporting(false);
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
              <Button
                variant="outline"
                onClick={sharePDF}
                disabled={isExporting}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {isExporting ? "Sharing..." : "Share PDF"}
              </Button>
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

          {/* Fuel Type Distribution - Donut Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Fuel Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fuelTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  activeIndex={activeDonutIndex !== null ? activeDonutIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                  onMouseLeave={() => setActiveDonutIndex(null)}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {fuelTypeData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      style={{ cursor: 'pointer', transition: 'opacity 0.3s ease' }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} car(s)`, 'Count']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                />
                {/* Center label - only show when not hovering */}
                {activeDonutIndex === null && (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="hsl(var(--foreground))">
                      {selectedCars.length}
                    </tspan>
                    <tspan x="50%" dy="1.5em" fontSize="12" fill="hsl(var(--muted-foreground))">
                      Cars
                    </tspan>
                  </text>
                )}
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {selectedCars.map((car, index) => {
              const financing = calculateFinancing(car.price_lakhs);
              
              return (
                <motion.div
                  key={car.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    layout: { duration: 0.3 }
                  }}
                >
                  <Card className="overflow-hidden h-full">
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
              </motion.div>
            );
          })}
          </AnimatePresence>
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

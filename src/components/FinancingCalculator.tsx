import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

interface Props {
  carPrice: number;
  carName: string;
}

const FinancingCalculator = ({ carPrice, carName }: Props) => {
  // Convert lakhs to actual rupees for calculations
  const carPriceInRupees = carPrice * 100000;
  const [downPayment, setDownPayment] = useState(carPrice * 0.2);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(5);

  // Calculate loan amount in rupees
  const downPaymentInRupees = downPayment * 100000;
  const loanAmount = carPriceInRupees - downPaymentInRupees;
  const monthlyRate = interestRate / 12 / 100;
  const numPayments = loanTenure * 12;
  
  // EMI calculation
  const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments) / 
              (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const totalAmount = emi * numPayments;
  const totalInterest = totalAmount - loanAmount;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Calculator className="w-4 h-4 mr-2" />
          Calculate EMI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Financing Calculator - {carName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Car Price</p>
            <p className="text-2xl font-bold">₹{carPrice.toFixed(2)}L</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="downPayment">Down Payment (₹ Lakhs)</Label>
              <Input
                id="downPayment"
                type="number"
                step="0.5"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                max={carPrice}
              />
            </div>

            <div>
              <Label htmlFor="interestRate">Interest Rate (% per annum)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="loanTenure">Loan Tenure (Years)</Label>
              <Input
                id="loanTenure"
                type="number"
                step="1"
                value={loanTenure}
                onChange={(e) => setLoanTenure(Number(e.target.value))}
                min={1}
                max={10}
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan Amount:</span>
              <span className="font-semibold">₹{(loanAmount / 100000).toFixed(2)}L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly EMI:</span>
              <span className="font-semibold text-primary">₹{(emi / 100000).toFixed(2)}L</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Interest:</span>
              <span className="font-semibold">₹{(totalInterest / 100000).toFixed(2)}L</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-primary">₹{(totalAmount / 100000).toFixed(2)}L</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancingCalculator;

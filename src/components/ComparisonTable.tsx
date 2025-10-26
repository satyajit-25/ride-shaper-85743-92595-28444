import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface CarData {
  name: string;
  brand: string;
  type: string;
  fuel_type: string;
  price_lakhs: number;
  mileage_kmpl: number;
  features: string[];
}

interface Props {
  cars: CarData[];
}

const ComparisonTable = ({ cars }: Props) => {
  if (cars.length === 0) return null;

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <BarChart3 className="w-6 h-6 text-primary" />
          Detailed Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-semibold bg-muted">Feature</th>
                {cars.map((car, index) => (
                  <th key={index} className="text-left p-4 font-semibold bg-muted">
                    {car.brand} {car.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-medium">Price</td>
                {cars.map((car, index) => (
                  <td key={index} className="p-4">₹{car.price_lakhs} Lakhs</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-medium">Mileage</td>
                {cars.map((car, index) => (
                  <td key={index} className="p-4">{car.mileage_kmpl} kmpl</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-medium">Fuel Type</td>
                {cars.map((car, index) => (
                  <td key={index} className="p-4">{car.fuel_type}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-muted/50">
                <td className="p-4 font-medium">Type</td>
                {cars.map((car, index) => (
                  <td key={index} className="p-4">{car.type}</td>
                ))}
              </tr>
              <tr className="hover:bg-muted/50">
                <td className="p-4 font-medium">Key Features</td>
                {cars.map((car, index) => (
                  <td key={index} className="p-4">
                    <ul className="list-disc list-inside space-y-1">
                      {car.features.slice(0, 3).map((feature, fIndex) => (
                        <li key={fIndex} className="text-sm">{feature}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonTable;

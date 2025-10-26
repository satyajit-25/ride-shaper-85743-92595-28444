import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  fuelType: z.string().min(1, "Please select a fuel type"),
  priceRange: z.string().min(1, "Please enter max price").regex(/^\d+$/, "Must be a valid number"),
  carType: z.string().min(1, "Please select a car type"),
  mileagePreference: z.string().min(1, "Please select mileage preference"),
});

interface Props {
  onRecommendations: (recommendations: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

type FormData = z.infer<typeof formSchema>;

const CarRecommendationForm = ({ onRecommendations, setIsLoading }: Props) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fuelType: "",
      priceRange: "",
      carType: "",
      mileagePreference: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setIsLoading(true);

    try {
      // Create natural language query
      const query = `I want a ${data.carType} under ${data.priceRange} lakhs with ${data.mileagePreference} mileage, preferably ${data.fuelType}.`;

      // Call edge function
      const { data: result, error } = await supabase.functions.invoke('recommend-cars', {
        body: { 
          userQuery: query,
          fuelType: data.fuelType,
          priceRange: data.priceRange,
          carType: data.carType,
          mileagePreference: data.mileagePreference
        }
      });

      if (error) throw error;

      onRecommendations(result.recommendations);
      
      toast({
        title: "Success!",
        description: "Found your perfect car matches",
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get recommendations",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="carType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Car Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select car type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fuelType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priceRange"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Price (in lakhs) *</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 15" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mileagePreference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mileage Preference *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mileage preference" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="excellent">Excellent (20+ km/l)</SelectItem>
                  <SelectItem value="good">Good (15-20 km/l)</SelectItem>
                  <SelectItem value="average">Average (below 15 km/l)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Find My Perfect Car
        </Button>
      </form>
    </Form>
  );
};

export default CarRecommendationForm;

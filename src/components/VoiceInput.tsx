import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onRecommendations: (recommendations: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

const VoiceInput = ({ onRecommendations, setIsLoading }: Props) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const { toast } = useToast();

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your car preferences",
      });
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
      setIsLoading(true);

      try {
        const { data: result, error } = await supabase.functions.invoke('recommend-cars', {
          body: { 
            userQuery: text,
            fuelType: "",
            priceRange: "",
            carType: "",
            mileagePreference: ""
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
        setIsLoading(false);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: "Error",
        description: "Failed to recognize speech. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Click the microphone and tell us what you're looking for
        </p>
        <p className="text-sm text-muted-foreground italic">
          Example: "I want an SUV under 15 lakhs with good mileage, preferably diesel"
        </p>
      </div>

      <Button
        size="lg"
        className="w-full max-w-md"
        onClick={startListening}
        disabled={isListening}
        variant={isListening ? "secondary" : "default"}
      >
        {isListening ? (
          <>
            <MicOff className="mr-2 h-5 w-5 animate-pulse" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Start Voice Input
          </>
        )}
      </Button>

      {transcript && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="font-medium mb-2">You said:</p>
          <p className="text-foreground">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;

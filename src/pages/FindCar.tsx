import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CarRecommendationForm, { FormHandle } from "@/components/CarRecommendationForm";
import VoiceInput from "@/components/VoiceInput";
import ConversationalInput from "@/components/ConversationalInput";
import RecommendationResults from "@/components/RecommendationResults";
import SearchHistory from "@/components/SearchHistory";
import ComparisonTable from "@/components/ComparisonTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Sparkles, LogOut, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FindCar = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [activeTab, setActiveTab] = useState("form");
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<FormHandle>(null);

  const handleRecommendations = (recs: any[]) => {
    setRecommendations(recs);
    setRefreshHistory(prev => prev + 1);
  };

  const handleSearchClick = (search: any) => {
    if (search.fuel_type && search.price_range && search.car_type && search.mileage_preference) {
      formRef.current?.setFormValues({
        fuelType: search.fuel_type,
        priceRange: search.price_range,
        carType: search.car_type,
        mileagePreference: search.mileage_preference,
      });
      setActiveTab("form");
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast({
        title: "Search loaded",
        description: "Your previous search has been loaded into the form",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-cyan opacity-10"></div>
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/home')}
              className="hover:bg-accent/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
            
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Car Finder
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/favorites')}
                className="text-muted-foreground hover:text-primary"
                title="View Favorites"
              >
                <Heart className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative py-16 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Find Your Perfect Car
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tell us what you're looking for and let our AI do the magic
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-8 bg-card/50 border backdrop-blur-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="form">
                    Form Input
                  </TabsTrigger>
                  <TabsTrigger value="conversation">
                    Conversation
                  </TabsTrigger>
                  <TabsTrigger value="voice">
                    Voice Input
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="form">
                  <CarRecommendationForm 
                    ref={formRef}
                    onRecommendations={handleRecommendations}
                    setIsLoading={setIsLoading}
                  />
                </TabsContent>

                <TabsContent value="conversation">
                  <ConversationalInput 
                    onRecommendations={handleRecommendations}
                    setIsLoading={setIsLoading}
                  />
                </TabsContent>

                <TabsContent value="voice">
                  <VoiceInput 
                    onRecommendations={handleRecommendations}
                    setIsLoading={setIsLoading}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>

          {/* Results */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 text-center"
            >
              <div className="inline-block relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
                />
              </div>
              <p className="mt-6 text-lg text-muted-foreground">AI is analyzing your preferences...</p>
            </motion.div>
          )}

          {recommendations.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-12"
            >
              <RecommendationResults recommendations={recommendations} />
              <ComparisonTable cars={recommendations.map(rec => rec.car)} />
            </motion.div>
          )}

          {!isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16"
            >
              <SearchHistory 
                key={refreshHistory} 
                onSearchClick={handleSearchClick}
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-border bg-card/50 mt-20">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>© 2025 Intelligent Car Recommendation System. Powered by AI Technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default FindCar;

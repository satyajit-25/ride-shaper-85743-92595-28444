import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cpu, Target, Zap, Search, CheckCircle, ArrowRight, Mail, Phone, MapPin, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const features = [
    {
      icon: Cpu,
      title: "Smart AI Matching",
      description: "Advanced machine learning algorithms analyze your preferences and match you with the perfect vehicle based on thousands of data points."
    },
    {
      icon: Target,
      title: "Personalized Suggestions",
      description: "Get tailored recommendations that consider your budget, lifestyle, fuel preferences, and unique requirements for an ideal match."
    },
    {
      icon: Zap,
      title: "Real-time Comparison",
      description: "Compare multiple vehicles instantly with detailed specs, features, and AI-generated insights to make informed decisions quickly."
    }
  ];

  const steps = [
    { icon: Search, title: "Enter Preferences", description: "Share your requirements" },
    { icon: Cpu, title: "AI Analysis", description: "Our AI processes data" },
    { icon: Target, title: "Get Matches", description: "Receive top recommendations" },
    { icon: CheckCircle, title: "Choose & Drive", description: "Select your perfect car" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Fixed Header Buttons */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-destructive bg-card/80 backdrop-blur-sm"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
      
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

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto text-center z-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-6 py-3 mb-8 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm"
          >
            <Cpu className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">AI-Powered Technology</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight"
          >
            Intelligent Car
            <br />
            Recommendation System
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto"
          >
            Find your perfect car using AI-powered recommendations.
            <br />
            Smart. Fast. Personalized.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => navigate('/find-car')}
              className="relative group px-12 py-7 text-xl font-semibold"
            >
              <span className="flex items-center gap-3">
                Get Started
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>

        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of car shopping with our cutting-edge AI technology
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="relative group p-8 h-full bg-card/50 border hover:border-primary/50 backdrop-blur-sm transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 mb-6 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30"
                    >
                      <feature.icon className="w-8 h-8 text-primary" />
                    </motion.div>

                    <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-300"></div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-32 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to find your dream car
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="relative mx-auto w-24 h-24 mb-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse"></div>
                  <div className="absolute inset-1 bg-background rounded-full flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                </motion.div>

                <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="relative py-16 px-4 border-t border bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Car Finder
              </h3>
              <p className="text-muted-foreground mb-4">
                Revolutionary AI-powered car recommendation platform helping you find your perfect vehicle.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-foreground">Quick Links</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#home" className="hover:text-primary transition-colors">Home</a></li>
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-foreground">Contact</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <a href="mailto:contact@aicarfinder.com" className="hover:text-primary transition-colors">
                    contact@aicarfinder.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Bhubaneswar, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center">
            <p className="text-muted-foreground">
              © 2026 Intelligent Car Recommendation System. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

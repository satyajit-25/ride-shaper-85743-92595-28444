import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  onRecommendations: (recommendations: any[]) => void;
  setIsLoading: (loading: boolean) => void;
}

const ConversationalInput = ({ onRecommendations, setIsLoading }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    const userMessage = input.trim();
    setInput("");
    setIsSubmitting(true);
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const { data: result, error } = await supabase.functions.invoke('recommend-cars', {
        body: { 
          userQuery: userMessage,
          conversationId: conversationId,
          previousMessages: messages
        }
      });

      if (error) throw error;

      // Store conversation ID for follow-ups
      if (result.conversationId) {
        setConversationId(result.conversationId);
      }

      // Add AI response
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: result.aiResponse || "Here are your recommendations:" 
      }]);

      onRecommendations(result.recommendations);
      
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get recommendations",
        variant: "destructive",
      });
      
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    toast({
      title: "New Conversation",
      description: "Started a fresh conversation",
    });
  };

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
          <p className="text-muted-foreground">
            Ask me anything about cars! You can follow up with questions like:<br/>
            "Show me cheaper options" or "What about SUVs?"
          </p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <Button
            variant="outline"
            size="sm"
            onClick={startNewConversation}
            className="w-full"
          >
            Start New Conversation
          </Button>
        </>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            messages.length === 0
              ? "e.g., I want a fuel-efficient SUV under 15 lakhs..."
              : "Ask a follow-up question..."
          }
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button type="submit" disabled={isSubmitting || !input.trim()}>
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ConversationalInput;

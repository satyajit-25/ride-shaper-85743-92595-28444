import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { History, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";

interface Search {
  id: string;
  user_query: string;
  created_at: string;
}

const SearchHistory = () => {
  const [searches, setSearches] = useState<Search[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSearches();
    }
  }, [user]);

  const fetchSearches = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching searches:", error);
      return;
    }

    setSearches(data || []);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("searches")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Search deleted successfully",
    });
    
    fetchSearches();
  };

  if (searches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Searches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{search.user_query}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(search.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(search.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchHistory;

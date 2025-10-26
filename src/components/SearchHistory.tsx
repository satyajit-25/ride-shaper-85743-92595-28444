import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { History, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Search {
  id: string;
  user_query: string;
  created_at: string;
}

const SearchHistory = () => {
  const [searches, setSearches] = useState<Search[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    const { data, error } = await (supabase as any)
      .from("searches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching searches:", error);
      return;
    }

    setSearches(data || []);
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from("searches")
      .delete()
      .eq("id", id);

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
              className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{search.user_query}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(search.created_at).toLocaleDateString()}
                </p>
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

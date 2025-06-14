
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: number;
  content: string;
  created_at: string;
}

const Dashboard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch existing posts ordered by created_at desc
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("generated_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
    };
    fetchPosts();
  }, []);

  // Handle copy to clipboard
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Post copied to clipboard",
    });
  };

  // Handle post generation
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generatePost");
      if (error || !data || !data.content) {
        toast({
          title: "Generation failed",
          description: "Please try again later",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // Prepend newly generated post to list
      setPosts((prev) => [
        {
          id: Date.now(), // temp fallback, real id comes from DB after refresh
          content: data.content,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch {
      toast({
        title: "Generation failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col px-0 sm:px-0">
      <div className="flex-1 w-full max-w-lg mx-auto py-8 space-y-6">
        <h1 className="text-2xl font-bold mb-3 text-center">Your dashboard</h1>
        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-14 text-lg font-semibold shadow-md rounded-lg"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating…
            </span>
          ) : (
            "Generate Posts"
          )}
        </Button>
        {/* Posts List */}
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="shadow-sm rounded-lg p-4 w-full flex flex-row justify-between items-start"
            >
              <span className="text-base text-gray-800 flex-1 mr-3">{post.content}</span>
              <button
                className="p-2 rounded-lg hover:bg-blue-50 transition"
                onClick={() => handleCopy(post.content)}
                aria-label="Copy to clipboard"
              >
                <Copy className="h-5 w-5 text-gray-400" />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

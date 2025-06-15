import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Loader2, Trash2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef } from "react";
import Header from "@/components/Header";

interface Post {
  id: number;
  content: string;
  created_at: string;
  favorited: boolean;
}

const Dashboard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [toggleFavoriteLoading, setToggleFavoriteLoading] = useState<number | null>(null);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleText, setSampleText] = useState("");
  const maxLen = 280;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [trends, setTrends] = useState<string[]>([]);
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Fetch posts including 'favorited'
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

  // Fetch trends on mount and when niche changes (setup a simple reload trigger)
  useEffect(() => {
    let mounted = true;
    const fetchTrends = async () => {
      setTrendsLoading(true);
      const { data, error } = await supabase.functions.invoke("fetchTrends");
      if (mounted) {
        setTrends(data?.trends || []);
        setTrendsLoading(false);
      }
    };
    fetchTrends();
    return () => { mounted = false };
  }, []);

  // Listen to niche changes from ProfileDrawer (custom event approach)
  useEffect(() => {
    // Listen for a window event after profile edit
    const handler = () => {
      // refetch trends after profile changes & drawer closes
      setTrendsLoading(true);
      supabase.functions.invoke("fetchTrends").then(({ data }) => {
        setTrends(data?.trends || []);
        setTrendsLoading(false);
        setSelectedHeadline(null); // Optionally reset selection when profile changes
      });
    };
    window.addEventListener("profileUpdated", handler);
    return () => window.removeEventListener("profileUpdated", handler);
  }, []);

  // Handle copy to clipboard
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Post copied to clipboard",
    });
  };

  // Updated handleGenerate
  const handleGenerate = async () => {
    setLoading(true);
    try {
      // If sampleText is present and not just whitespace, include it
      const body: Record<string, any> = {};
      if (sampleText.trim().length > 0) {
        body.sampleText = sampleText.trim();
      }
      if (selectedHeadline) {
        body.headline = selectedHeadline;
      }
      const { data, error } = await supabase.functions.invoke("generatePost", {
        body,
      });
      if (error || !data || !data.content) {
        toast({
          title: "Generation failed",
          description: "Please try again later",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setPosts((prev) => [
        {
          id: Date.now(), // temp fallback
          content: data.content,
          created_at: new Date().toISOString(),
          favorited: false,
        },
        ...prev,
      ]);
      setSampleText(""); // Clear textarea on success
      setSampleOpen(false);
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
      // Keep selectedHeadline as is for smoother UX
    } catch {
      toast({
        title: "Generation failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Handle post deletion
  const handleDelete = async (postId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    // Optimistically remove from UI
    setPosts((prev) => prev.filter((post) => post.id !== postId));

    const { error } = await supabase
      .from("generated_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast({
        title: "Delete failed",
        description: "Could not delete post. Please try again.",
        variant: "destructive",
      });
      // Revert UI change if error
      // Refetch whole list for correctness
      const { data } = await supabase
        .from("generated_posts")
        .select("*")
        .order("created_at", { ascending: false });
      setPosts(data || []);
    } else {
      toast({
        title: "Deleted",
        description: "The post was deleted.",
      });
    }
  };

  // Toggle favorite
  const handleFavorite = async (postId: number, current: boolean) => {
    setToggleFavoriteLoading(postId);
    const { error } = await supabase
      .from("generated_posts")
      .update({ favorited: !current })
      .eq("id", postId);

    if (error) {
      toast({
        title: "Could not update favorite",
        description: "Please try again.",
        variant: "destructive",
      });
    } else {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, favorited: !current } : p
        )
      );
      toast({
        title: !current ? "Post favorited!" : "Removed from favorites",
      });
    }
    setToggleFavoriteLoading(null);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col px-0 sm:px-0">
        <div className="flex-1 w-full max-w-lg mx-auto py-8 space-y-6">
          <h1 className="text-2xl font-bold mb-3 text-center">Your dashboard</h1>
          
          {/* Trending headlines chips */}
          {trendsLoading ? (
            <div className="flex justify-center py-2"><Loader2 className="animate-spin h-5 w-5 text-blue-500" /></div>
          ) : trends.length > 0 && (
            <div className="flex flex-row flex-wrap gap-2 mb-1">
              {trends.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHeadline(selectedHeadline === h ? null : h)}
                  className={`px-3 py-1 rounded-full text-sm border transition
                    ${selectedHeadline === h ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 border-gray-300 text-gray-800"}
                  `}
                  aria-pressed={selectedHeadline === h}
                >
                  {h}
                </button>
              ))}
            </div>
          )}

          {/* Writing Sample Collapsible */}
          <Collapsible open={sampleOpen} onOpenChange={setSampleOpen}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">
                Add a new writing sample (optional)
              </span>
              <CollapsibleTrigger asChild>
                <button
                  className="p-2"
                  aria-label={sampleOpen ? "Hide writing sample input" : "Show writing sample input"}
                >
                  {sampleOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="mt-2 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Paste your recent writing sample…"
                  value={sampleText}
                  maxLength={maxLen}
                  onChange={(e) => setSampleText(e.target.value)}
                  className="resize-none mb-1"
                  rows={4}
                  aria-label="Writing sample for personalization"
                />
                <div className="absolute right-0 bottom-2 mr-2 text-xs text-gray-500 select-none">
                  {sampleText.length}/{maxLen}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

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
          {/* Posts List or Empty State */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full bg-white rounded-lg shadow-md p-8 mt-8">
              <div className="text-5xl mb-4 select-none">📝</div>
              <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">
                No posts yet. Click ‘Generate Posts’ to create your first idea!
              </h2>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="shadow-sm rounded-lg p-4 w-full flex flex-row justify-between items-start relative"
                >
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="absolute right-3 top-3 p-1.5 rounded-md hover:bg-red-50 transition"
                    aria-label="Delete post"
                  >
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                  </button>

                  {/* Content + Actions Row */}
                  <span className="text-base text-gray-800 flex-1 mr-2">{post.content}</span>
                  <div className="flex flex-row items-center gap-1">
                    <button
                      className={`p-2 rounded-lg hover:bg-pink-50 transition`}
                      aria-label={post.favorited ? "Remove from favorites" : "Favorite post"}
                      onClick={() => handleFavorite(post.id, post.favorited)}
                      disabled={toggleFavoriteLoading === post.id}
                      style={{ color: post.favorited ? "#e83e8c" : "#a0aec0" }}
                    >
                      <Heart
                        className={`h-5 w-5 ${post.favorited ? "fill-pink-500 text-pink-500" : ""}`}
                        fill={post.favorited ? "#e83e8c" : "none"}
                      />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-blue-50 transition"
                      onClick={() => handleCopy(post.content)}
                      aria-label="Copy to clipboard"
                    >
                      <Copy className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

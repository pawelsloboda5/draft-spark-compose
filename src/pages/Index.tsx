
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, RefreshCw, Edit3 } from "lucide-react";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";

interface GeneratedPost {
  id: string;
  content: string;
}

const Index = () => {
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [sampleText, setSampleText] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const { toast } = useToast();

  const niches = ["AI", "Fitness", "Finance", "Health", "Travel"];
  const tones = ["Formal", "Casual", "Humorous", "Motivational"];

  const handleGenerate = async () => {
    if (!selectedNiche) {
      toast({
        title: "Please select a niche",
        description: "Choose a niche to generate relevant posts",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPosts: GeneratedPost[] = [
        {
          id: "1",
          content: `🚀 The future of ${selectedNiche.toLowerCase()} is here! Discover how cutting-edge innovations are transforming the industry. What's your take on the latest trends? #${selectedNiche} #Innovation`
        },
        {
          id: "2",
          content: `💡 Quick tip for ${selectedNiche.toLowerCase()} enthusiasts: Success isn't just about what you know, it's about how you apply that knowledge. Share your best ${selectedNiche.toLowerCase()} hack below! 👇`
        },
        {
          id: "3",
          content: `🔥 Hot take: The biggest mistake people make in ${selectedNiche.toLowerCase()} is overthinking. Sometimes the simplest approach yields the best results. Agree or disagree? Let's discuss! 💬`
        }
      ];
      
      setGeneratedPosts(mockPosts);
      toast({
        title: "Posts generated successfully!",
        description: `Created ${mockPosts.length} posts for ${selectedNiche}`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedPosts([]);
    handleGenerate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Post copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 pb-32 pt-6 max-w-2xl">
        {/* Form Section */}
        <div className="space-y-6 mb-8">
          {/* Niche Selection */}
          <div className="space-y-2">
            <Label htmlFor="niche" className="text-lg font-semibold text-gray-800">
              Choose your niche
            </Label>
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="w-full h-12 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Select your content niche" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-100 shadow-lg">
                {niches.map((niche) => (
                  <SelectItem key={niche} value={niche} className="text-base py-3 hover:bg-blue-50">
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Writing Samples */}
          <div className="space-y-2">
            <Label htmlFor="samples" className="text-lg font-semibold text-gray-800">
              Paste your writing samples (optional)
            </Label>
            <Textarea
              id="samples"
              placeholder="Share some examples of your writing style to personalize the generated content..."
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              className="min-h-[120px] text-base border-2 border-gray-200 focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label htmlFor="tone" className="text-lg font-semibold text-gray-800">
              Select predefined tone
            </Label>
            <Select value={selectedTone} onValueChange={setSelectedTone}>
              <SelectTrigger className="w-full h-12 text-base border-2 border-gray-200 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Choose your content tone" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-100 shadow-lg">
                {tones.map((tone) => (
                  <SelectItem key={tone} value={tone} className="text-base py-3 hover:bg-blue-50">
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generated Posts */}
        {generatedPosts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Generated Posts</h2>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-2"
                disabled={isGenerating}
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
            
            <div className="space-y-4">
              {generatedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  content={post.content}
                  onCopy={() => copyToClipboard(post.content)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-4 shadow-lg">
        <div className="container mx-auto max-w-2xl">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedNiche}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Posts...
              </>
            ) : (
              "Generate Posts"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;

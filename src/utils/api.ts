
import { supabase } from "@/integrations/supabase/client";

export interface GeneratePostsRequest {
  niche: string;
  sampleText?: string;
  tone?: string;
  userId?: string;
}

export interface GeneratedPost {
  id: string;
  content: string;
  createdAt: string;
}

// Function to call the generate-posts Edge Function
export const generatePosts = async (request: GeneratePostsRequest): Promise<GeneratedPost[]> => {
  console.log('generatePosts called with:', request);
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-posts', {
      body: request
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to generate posts');
    }

    return data.posts || [];
  } catch (error) {
    console.error('Generate posts error:', error);
    
    // Fallback to mock data if Edge Function fails
    const mockPosts: GeneratedPost[] = [
      {
        id: crypto.randomUUID(),
        content: `🚀 The future of ${request.niche.toLowerCase()} is here! Discover how cutting-edge innovations are transforming the industry.`,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        content: `💡 Quick tip for ${request.niche.toLowerCase()} enthusiasts: Success isn't just about what you know, it's about application.`,
        createdAt: new Date().toISOString(),
      },
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return mockPosts;
  }
};

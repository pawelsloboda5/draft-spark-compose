
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?supabaseClient';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    // 1. Auth check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = user.id;

    // 2. Load user niche
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('niche')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.niche) {
      return new Response(JSON.stringify({ error: "Profile not set" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. NewsAPI logic (similar to generatePost)
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    let trends: string[] = [];

    try {
      const categoryMap: { [key: string]: string } = {
        'AI': 'technology',
        'Fitness': 'health',
        'Finance': 'business',
        'Health': 'health',
        'Travel': 'general'
      };
      const category = categoryMap[profile.niche] || 'general';
      const newsUrl = `https://newsapi.org/v2/top-headlines?category=${category}&pageSize=5&sortBy=publishedAt&language=en`;
      const newsResponse = await fetch(newsUrl, { headers: { 'X-Api-Key': newsApiKey! } });

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        trends = newsData.articles?.map((a: any) => a.title).filter(Boolean) || [];
        if (trends.length > 0) {
          for (const headline of trends) {
            try {
              await supabaseAdmin
                .from('trending_posts')
                .insert({
                  niche: profile.niche,
                  content: headline,
                  source: 'newsapi'
                });
                // NOTE: onConflict is not available in edge runtime, so just insert — handle constraint at SQL level
            } catch (_) {
              // ignore insert errors (duplicate)
            }
          }
        }
      }
    } catch (_) { /* ignore */ }

    // fallback to db cache if <2
    if (trends.length < 2) {
      const { data: fallbackTrends, error: trendsError } = await supabaseAdmin
        .from('trending_posts')
        .select('content')
        .eq('niche', profile.niche)
        .order('collected_at', { ascending: false })
        .limit(5);
      if (!trendsError && fallbackTrends) {
        trends = fallbackTrends.map((t) => t.content);
      }
    }
    // Only latest 3
    trends = trends.slice(0, 3);

    return new Response(JSON.stringify({ trends }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

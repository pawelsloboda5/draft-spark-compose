
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1️⃣ Auth check
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log('Authenticated user:', userId);

    // 2️⃣ Load user context
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('niche, tone')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: "Profile not set" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: examplesData, error: examplesError } = await supabaseAdmin
      .from('user_examples')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    const examples = examplesData?.map(ex => ex.content) || [];
    console.log('User profile:', profile);
    console.log('Examples count:', examples.length);

    // 3️⃣ Fetch fresh trending topics
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
      
      console.log('Fetching from NewsAPI:', newsUrl);
      
      const newsResponse = await fetch(newsUrl, {
        headers: {
          'X-Api-Key': newsApiKey!
        }
      });

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        trends = newsData.articles?.map((article: any) => article.title).filter(Boolean) || [];
        console.log('Fetched trends from NewsAPI:', trends.length);

        // 4️⃣ Cache headlines
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
            } catch (insertError) {
              console.log('Insert conflict (expected):', insertError);
            }
          }
        }
      }
    } catch (newsError) {
      console.error('NewsAPI error:', newsError);
    }

    // Fallback to database if NewsAPI fails or returns <2 titles
    if (trends.length < 2) {
      console.log('Using fallback trends from database');
      const { data: fallbackTrends, error: trendsError } = await supabaseAdmin
        .from('trending_posts')
        .select('content')
        .eq('niche', profile.niche)
        .order('collected_at', { ascending: false })
        .limit(5);

      if (!trendsError && fallbackTrends) {
        trends = fallbackTrends.map(t => t.content);
      }
    }

    console.log('Final trends count:', trends.length);

    // 5️⃣ OpenAI prompt & call
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const systemPrompt = "You are a social-media copywriter that perfectly mimics a user's tone.";
    
    const userPrompt = `Niche: ${profile.niche}
Tone: ${profile.tone}
Writing style samples:
${examples.join('\n')}

Fresh trending topics:
${trends.slice(0, 3).map(trend => `• ${trend}`).join('\n')}

Write ONE short social post (≤280 chars) that combines the user's tone with ONE of the trending topics. Respond with only the post text.`;

    console.log('Calling OpenAI with prompt length:', userPrompt.length);

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 120
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', errorText);
      throw new Error('OpenAI API call failed');
    }

    const completion = await openaiResponse.json();
    const generatedText = completion.choices[0].message.content.trim();
    
    console.log('Generated text:', generatedText);

    // 6️⃣ Persist & return
    const { error: insertError } = await supabaseAdmin
      .from('generated_posts')
      .insert({
        user_id: userId,
        content: generatedText
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save generated post');
    }

    return new Response(JSON.stringify({ content: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('GeneratePost function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

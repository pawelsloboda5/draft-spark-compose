
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user')
    }

    // Parse request body
    const { niche, sampleText, tone } = await req.json()

    if (!niche) {
      throw new Error('Niche is required')
    }

    // Save user preferences to profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        niche,
        tone,
        sample_text: sampleText,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile save error:', profileError)
    }

    // TODO: Integrate with AI service (OpenAI, Anthropic, etc.)
    // For now, return mock data
    const mockPosts = [
      {
        id: crypto.randomUUID(),
        content: `🚀 The future of ${niche.toLowerCase()} is here! Discover how cutting-edge innovations are transforming the industry. What's your take on the latest trends? #${niche} #Innovation`,
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        content: `💡 Quick tip for ${niche.toLowerCase()} enthusiasts: Success isn't just about what you know, it's about how you apply that knowledge. Share your best ${niche.toLowerCase()} hack below! 👇`,
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        content: `🔥 Hot take: The biggest mistake people make in ${niche.toLowerCase()} is overthinking. Sometimes the simplest approach yields the best results. Agree or disagree? Let's discuss! 💬`,
        createdAt: new Date().toISOString()
      }
    ]

    return new Response(
      JSON.stringify({ posts: mockPosts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

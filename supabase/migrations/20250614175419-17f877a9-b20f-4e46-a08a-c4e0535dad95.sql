
-- Create user_profiles table
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  niche TEXT,
  tone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_examples table
CREATE TABLE public.user_examples (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_posts table
CREATE TABLE public.generated_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trending_posts table (no RLS as requested)
CREATE TABLE public.trending_posts (
  id BIGSERIAL PRIMARY KEY,
  niche TEXT,
  content TEXT,
  source TEXT,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on user tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_examples
CREATE POLICY "Users can view their own examples" ON public.user_examples
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own examples" ON public.user_examples
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own examples" ON public.user_examples
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own examples" ON public.user_examples
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for generated_posts
CREATE POLICY "Users can view their own posts" ON public.generated_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON public.generated_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.generated_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.generated_posts
  FOR DELETE USING (auth.uid() = user_id);

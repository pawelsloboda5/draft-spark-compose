
# DraftCreate Setup Instructions

## Supabase Integration

To complete the setup of DraftCreate, you'll need to connect to Supabase for authentication and database functionality.

### 1. Connect to Supabase
Click the green Supabase button in the top-right corner of the Lovable interface and connect your project to Supabase.

### 2. Database Setup
Once connected, run the following SQL in your Supabase SQL editor to create the profiles table:

```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  niche TEXT,
  tone TEXT,
  sample_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see and edit their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

### 3. Edge Function Deployment
The `generate-posts` Edge Function is ready to be deployed. It includes:
- User authentication validation
- Profile data storage
- Mock post generation (ready for AI integration)

### 4. AI Integration (Future)
To integrate with AI services, add your API keys to Supabase secrets and update the Edge Function to call your preferred AI service (OpenAI, Anthropic, etc.).

## Features Implemented

✅ Mobile-first responsive design
✅ Niche selection dropdown
✅ Writing samples input
✅ Tone selection
✅ Generate posts functionality (with loading states)
✅ Copy to clipboard
✅ Regenerate posts
✅ Clean card-based post display
✅ Touch-friendly UI elements
✅ Supabase schema and Edge Function stubs
✅ User profiles table structure

## Next Steps

1. Connect to Supabase
2. Run the database setup SQL
3. Deploy the Edge Function
4. Add AI service integration
5. Implement user authentication UI

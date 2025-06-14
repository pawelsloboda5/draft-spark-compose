
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NICHE_OPTIONS = ["AI", "Fitness", "Finance", "Health", "Travel"];
const TONE_OPTIONS = ["Formal", "Casual", "Humorous", "Motivational"];

const SetupProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [example, setExample] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ niche: false, tone: false, example: false });

  // Validate
  const errors = {
    niche: !niche && touched.niche ? "Please select your niche" : "",
    tone: !tone && touched.tone ? "Please select your preferred tone" : "",
    example: !example.trim() && touched.example ? "Please paste an example post" : "",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ niche: true, tone: true, example: true });
    if (!niche || !tone || !example.trim()) return;

    setLoading(true);

    try {
      const user_id = user?.id;
      // Insert into user_profiles
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([{ user_id, niche, tone }]);

      if (profileError) {
        toast({ title: "Error", description: profileError.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Insert into user_examples
      const { error: exampleError } = await supabase
        .from("user_examples")
        .insert([{ user_id, content: example }]);

      if (exampleError) {
        toast({ title: "Error", description: exampleError.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      toast({ title: "Profile saved", description: "Your profile has been set up." });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast({ title: "Unexpected error", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <form
        className="w-full max-w-md p-6 bg-white rounded-lg shadow space-y-6"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Set up your DraftCreate profile</h1>
        
        <div>
          <label className="block font-medium mb-1">Your niche</label>
          <Select value={niche} onValueChange={val => { setNiche(val); setTouched(t => ({ ...t, niche: true })); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select your niche" />
            </SelectTrigger>
            <SelectContent>
              {NICHE_OPTIONS.map(opt => (
                <SelectItem value={opt} key={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.niche && <p className="text-red-600 text-sm mt-1">{errors.niche}</p>}
        </div>
        
        <div>
          <label className="block font-medium mb-1">Preferred tone</label>
          <Select value={tone} onValueChange={val => { setTone(val); setTouched(t => ({ ...t, tone: true })); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tone" />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map(opt => (
                <SelectItem value={opt} key={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tone && <p className="text-red-600 text-sm mt-1">{errors.tone}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1">Paste one of your posts</label>
          <Textarea
            placeholder="I just crushed a 5-mile run 🏃‍♂️💨…"
            value={example}
            onChange={e => { setExample(e.target.value); setTouched(t => ({ ...t, example: true })); }}
            className="mt-1"
            rows={4}
          />
          {errors.example && <p className="text-red-600 text-sm mt-1">{errors.example}</p>}
        </div>
        
        <Button
          type="submit"
          className="w-full h-12 mt-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save profile"}
        </Button>
      </form>
    </div>
  );
};

export default SetupProfile;

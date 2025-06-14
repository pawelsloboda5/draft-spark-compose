
import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NICHE_OPTIONS = ["AI", "Fitness", "Finance", "Health", "Travel"];
const TONE_OPTIONS = ["Formal", "Casual", "Humorous", "Motivational"];
const MAX_SAMPLE_LEN = 280;

interface Sample {
  id: number;
  content: string;
  created_at: string;
}

export default function ProfileDrawer({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [sampleInput, setSampleInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingSampleId, setDeletingSampleId] = useState<number | null>(null);

  // Fetch user profile & samples on open
  useEffect(() => {
    if (!user?.id || !open) return;

    setLoading(true);

    Promise.all([
      supabase
        .from("user_profiles")
        .select("niche, tone")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("user_examples")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]).then(([profile, samplesRes]) => {
      if (profile.data) {
        setNiche(profile.data.niche || "");
        setTone(profile.data.tone || "");
      }
      setSamples(samplesRes.data || []);
      setLoading(false);
    });
  }, [user?.id, open]);

  // Save user_profiles upsert
  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        { user_id: user.id, niche, tone },
        { onConflict: "user_id" }
      );
    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Updated", description: "Profile updated." });
      setOpen(false);
    }
    setSaving(false);
  };

  // Add new sample
  const handleAddSample = async () => {
    if (!user?.id || !sampleInput.trim()) return;
    setAdding(true);
    const content = sampleInput.slice(0, MAX_SAMPLE_LEN);
    const { error, data } = await supabase
      .from("user_examples")
      .insert([{ user_id: user.id, content }])
      .select()
      .single();
    if (error) {
      toast({
        title: "Could not add sample",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setSamples((prev) => [data, ...prev]);
      setSampleInput("");
      toast({ title: "Sample added!" });
    }
    setAdding(false);
  };

  // Delete sample
  const handleDeleteSample = async (id: number) => {
    if (!user?.id) return;
    setDeletingSampleId(id);
    const { error } = await supabase
      .from("user_examples")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSamples((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Sample deleted" });
    }
    setDeletingSampleId(null);
  };

  // Drawer content
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent
        className="max-w-full sm:max-w-[420px] w-full right-0 fixed sm:rounded-l-xl bg-white border-l"
        style={{ width: "100vw", maxWidth: 420 }}
      >
        <DrawerHeader>
          <DrawerTitle className="text-lg font-bold">Profile</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col px-4 gap-4">
          {/* Niche */}
          <div>
            <label className="block mb-1 font-medium">Your niche</label>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger>
                <SelectValue placeholder="Select your niche" />
              </SelectTrigger>
              <SelectContent>
                {NICHE_OPTIONS.map(opt => (
                  <SelectItem value={opt} key={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Tone */}
          <div>
            <label className="block mb-1 font-medium">Preferred tone</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map(opt => (
                  <SelectItem value={opt} key={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Writing samples */}
          <div>
            <label className="block mb-1 font-medium">Writing samples</label>
            <div className="flex flex-col gap-2">
              {samples.length === 0 && (
                <span className="text-muted-foreground text-sm italic">No samples added</span>
              )}
              {samples.map(sample => (
                <div
                  key={sample.id}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border"
                >
                  <span className="text-sm text-gray-800 line-clamp-2">{sample.content}</span>
                  <button
                    className="ml-2 text-gray-400 hover:text-red-500 p-1"
                    onClick={() => handleDeleteSample(sample.id)}
                    disabled={deletingSampleId === sample.id}
                    title="Delete sample"
                    aria-label="Delete sample"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {/* Add new sample */}
            <div className="mt-3">
              <Textarea
                rows={3}
                maxLength={MAX_SAMPLE_LEN}
                value={sampleInput}
                onChange={e => setSampleInput(e.target.value)}
                placeholder="Paste your writing sample…"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">{sampleInput.length}/{MAX_SAMPLE_LEN}</span>
                <Button
                  onClick={handleAddSample}
                  size="sm"
                  disabled={adding || !sampleInput.trim()}
                  className="ml-2"
                >
                  {adding ? "Adding…" : "Add sample"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || loading || !niche || !tone}
          >
            {saving ? "Saving…" : "Save Profile"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

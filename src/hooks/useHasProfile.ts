
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns { hasProfile, isLoading, error }
 */
export function useHasProfile() {
  const { user } = useAuth();

  const user_id = user?.id || null;
  const enabled = !!user_id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile", user_id],
    queryFn: async () => {
      if (!user_id) return false;
      const { data } = await supabase
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", user_id)
        .maybeSingle();
      return !!data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return { hasProfile: !!data, isLoading, error };
}

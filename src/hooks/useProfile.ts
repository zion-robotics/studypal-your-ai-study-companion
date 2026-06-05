import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type UserProfile = {
  user_id: string;
  user_type: "tertiary" | "secondary";
  school_name?: string;
  course?: string;
  level?: string;
  exam_types?: string[];
  subjects?: string[];
  exam_date?: string;
  hours_per_day?: number;
  learning_mode?: "voice" | "text" | "mixed";
  notifications_enabled?: boolean;
  onboarding_completed?: boolean;
  full_name?: string;
};

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setProfile(data ?? {
          user_id: user.id,
          user_type: "secondary",
          full_name: user.user_metadata?.full_name ?? "Student",
        });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { profile, loading };
}

export function daysUntil(dateStr?: string): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
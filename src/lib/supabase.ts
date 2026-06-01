// Supabase client placeholder. Replace URL and anon key once Lovable Cloud is enabled
// or paste your own Supabase project credentials.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co"; // <- replace
const SUPABASE_ANON_KEY = "YOUR-PUBLISHABLE-ANON-KEY"; // <- replace

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

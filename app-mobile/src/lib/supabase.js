import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const isPlaceholder = (value) => {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized === "your-anon-key" ||
    normalized === "your-project-ref" ||
    normalized === "changeme"
  );
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const rawAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const supabaseAnonKey = !isPlaceholder(rawAnon) ? rawAnon : rawKey;

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  throw new Error(
    "Variables Supabase manquantes. Configure EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY (ou EXPO_PUBLIC_SUPABASE_KEY) dans .env/.env.local",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

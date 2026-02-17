import { createClient } from "@supabase/supabase-js";

/**
 * Supabase project configuration.
 * Using user-provided placeholders as default fallbacks.
 */
const SUPABASE_URL = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  "https://gdoklosrdlxogtdrywhi.supabase.co";

const SUPABASE_ANON_KEY = 
  process.env.SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "sb_publishable_WVkMtDdclClWRdQmx4sTQA_wMlDccgk";

// Helper to check if key looks valid (Supabase keys are long JWTs, not Stripe keys)
const isValidKey = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 40;

let client;

if (isValidKey) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error("Supabase Initialization Error:", err);
  }
}

// Export the client. If it failed to initialize, we export a fallback to keep the app running.
export const supabase = client || {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.reject(new Error("Supabase is not configured correctly. Check your API Keys.")),
    signUp: () => Promise.reject(new Error("Supabase is not configured correctly. Check your API Keys.")),
    signOut: () => Promise.resolve({ error: null }),
    resend: () => Promise.reject(new Error("Supabase is not configured correctly."))
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Config error" } }), order: () => Promise.resolve({ data: [], error: { message: "Config error" } }) }) }),
    insert: () => Promise.reject(new Error("Supabase not configured")),
    delete: () => ({ eq: () => Promise.reject(new Error("Supabase not configured")) })
  }),
  storage: { from: () => ({ upload: () => Promise.reject(new Error("Supabase not configured")), createSignedUrl: () => Promise.resolve({ data: null }), remove: () => Promise.reject(new Error("Supabase not configured")) }) },
  rpc: () => Promise.reject(new Error("Supabase not configured"))
};

export const isSupabaseConfigured = isValidKey;
export const STORAGE_BUCKET = "Lockflow";
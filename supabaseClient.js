import { createClient } from "@supabase/supabase-js";

/**
 * Supabase project configuration.
 * Supports multiple environment variable prefixes to ensure compatibility across different deployment platforms.
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
  "";

// Guard against top-level crash. If the key is missing, we create a proxy-like object
// that will log errors when used, instead of crashing the whole application on load.
let client;

if (SUPABASE_ANON_KEY) {
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.error("Critical: Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("Supabase Error: SUPABASE_ANON_KEY is missing. Check your Vercel/Environment variables.");
}

/**
 * A safe wrapper that prevents the app from crashing if Supabase is not configured.
 */
export const supabase = client || {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.reject(new Error("Supabase is not configured. Please set SUPABASE_ANON_KEY.")),
    signUp: () => Promise.reject(new Error("Supabase is not configured. Please set SUPABASE_ANON_KEY.")),
    signOut: () => Promise.resolve({ error: null }),
    resend: () => Promise.reject(new Error("Supabase is not configured."))
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        order: () => Promise.resolve({ data: [], error: { message: "Supabase not configured" } })
      })
    }),
    insert: () => Promise.reject(new Error("Supabase not configured")),
    delete: () => ({ eq: () => Promise.reject(new Error("Supabase not configured")) })
  }),
  storage: {
    from: () => ({
      upload: () => Promise.reject(new Error("Supabase not configured")),
      createSignedUrl: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      remove: () => Promise.reject(new Error("Supabase not configured"))
    })
  },
  rpc: () => Promise.reject(new Error("Supabase not configured"))
};

export const isSupabaseConfigured = !!SUPABASE_ANON_KEY;
export const STORAGE_BUCKET = "Lockflow";

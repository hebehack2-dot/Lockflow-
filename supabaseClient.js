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

let client;

try {
  // We initialize the client but catch errors to prevent the "black screen" crash on mount.
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.error("Supabase Initialization Error:", err);
}

// Export the client. If it failed to initialize, we export a fallback to keep the app running.
export const supabase = client || {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: () => Promise.resolve({ data: { user: null } }),
    signInWithPassword: () => Promise.reject(new Error("Supabase key error")),
    signUp: () => Promise.reject(new Error("Supabase key error")),
    signOut: () => Promise.resolve({}),
    resend: () => Promise.reject(new Error("Supabase key error"))
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }), order: () => Promise.resolve({ data: [] }) }) }),
    insert: () => Promise.reject(new Error("Supabase key error")),
    delete: () => ({ eq: () => Promise.reject(new Error("Supabase key error")) })
  }),
  storage: { from: () => ({ upload: () => Promise.reject(new Error("Supabase key error")), createSignedUrl: () => Promise.resolve({ data: null }), remove: () => Promise.reject(new Error("Supabase key error")) }) },
  rpc: () => Promise.reject(new Error("Supabase key error"))
};

export const isSupabaseConfigured = !!SUPABASE_ANON_KEY;
export const STORAGE_BUCKET = "Lockflow";
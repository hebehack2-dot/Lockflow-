import { createClient } from "@supabase/supabase-js";

/**
 * Safely retrieves environment variables from common storage locations in 
 * Vite, Webpack, and Vercel environments.
 */
const getEnv = (name) => {
  try {
    // Check process.env (Standard/Vercel)
    if (typeof process !== "undefined" && process.env && process.env[name]) return process.env[name];
    
    // Check import.meta.env (Vite)
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (import.meta.env[name]) return import.meta.env[name];
      if (import.meta.env[`VITE_${name}`]) return import.meta.env[`VITE_${name}`];
    }
  } catch (e) {
    // Fail silently
  }
  return "";
};

const SUPABASE_URL = getEnv("SUPABASE_URL") || "https://gdoklosrdlxogtdrywhi.supabase.co";
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY") || "sb_publishable_WVkMtDdclClWRdQmx4sTQA_wMlDccgk";

/**
 * Supabase keys MUST be valid JWTs. 
 * Providing a placeholder like 'sb_publishable_...' will cause createClient to THROW a fatal error,
 * resulting in a black screen. This check prevents that crash.
 */
const isJWT = (token) => token && typeof token === 'string' && token.split('.').length === 3;

let client = null;
let configured = false;

if (SUPABASE_URL && isJWT(SUPABASE_ANON_KEY)) {
  try {
    // Attempt initialization
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    configured = true;
  } catch (err) {
    console.error("Supabase client failed to initialize:", err);
  }
}

/**
 * We export a 'mock' supabase object if initialization fails.
 * This prevents the rest of the application components from crashing when they 
 * try to access properties like 'supabase.auth'.
 */
export const supabase = client || {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.reject(new Error("Supabase is not configured with a valid JWT key.")),
    signUp: () => Promise.reject(new Error("Supabase is not configured.")),
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

export const isSupabaseConfigured = configured;
export const STORAGE_BUCKET = "Lockflow";

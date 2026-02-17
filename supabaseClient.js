import { createClient } from "@supabase/supabase-js";

/**
 * Robust environment variable loader.
 * In Vite (used by your Vercel deployment), variables MUST be prefixed 
 * with VITE_ to be visible in the browser.
 */
const getEnv = (name) => {
  const viteName = `VITE_${name}`;
  try {
    // 1. Try Vite's specific env object
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (import.meta.env[viteName]) return import.meta.env[viteName];
      if (import.meta.env[name]) return import.meta.env[name];
    }
    // 2. Try standard process.env (Build-time injection)
    if (typeof process !== "undefined" && process.env) {
      if (process.env[viteName]) return process.env[viteName];
      if (process.env[name]) return process.env[name];
    }
  } catch (e) {
    console.warn(`Error reading env var ${name}:`, e);
  }
  return "";
};

const SUPABASE_URL = getEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY");

// A valid Supabase key is a JWT (3 parts separated by dots, starting with eyJ)
const isLikelyValidKey = (token) => {
  if (!token || typeof token !== 'string') return false;
  // Supabase keys are long JWTs. Stripe keys (which start with sb_ or pk_) will fail this.
  return token.length > 50 && token.includes('.') && token.startsWith('eyJ');
};

let client = null;
let configState = "missing"; // "missing" | "invalid_format" | "ready"

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  if (isLikelyValidKey(SUPABASE_ANON_KEY)) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      configState = "ready";
    } catch (err) {
      console.error("Supabase Init Error:", err);
      configState = "error";
    }
  } else {
    configState = "invalid_format";
  }
}

// Export the client or a safe mock
export const supabase = client || {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.reject(new Error("Supabase not configured.")),
    signUp: () => Promise.reject(new Error("Supabase not configured.")),
    signOut: () => Promise.resolve({ error: null }),
    resend: () => Promise.reject(new Error("Supabase not configured."))
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }), order: () => Promise.resolve({ data: [] }) }) }),
    insert: () => Promise.reject(new Error("Supabase not configured")),
    delete: () => ({ eq: () => Promise.reject(new Error("Supabase not configured")) })
  }),
  storage: { from: () => ({ upload: () => Promise.reject(new Error("Supabase not configured")), createSignedUrl: () => Promise.resolve({ data: null }) }) },
  rpc: () => Promise.reject(new Error("Supabase not configured"))
};

export const isSupabaseConfigured = configState === "ready";
export const supabaseConfigError = configState;
export const STORAGE_BUCKET = "Lockflow";

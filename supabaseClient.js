import { createClient } from "@supabase/supabase-js";

const getEnv = (name) => {
  const viteName = `VITE_${name}`;
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (import.meta.env[viteName]) return import.meta.env[viteName];
      if (import.meta.env[name]) return import.meta.env[name];
    }
    if (typeof process !== "undefined" && process.env) {
      if (process.env[viteName]) return process.env[viteName];
      if (process.env[name]) return process.env[name];
    }
  } catch (e) {}
  return "";
};

const SUPABASE_URL = getEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY");

const isLikelyValidKey = (token) => {
  if (!token || typeof token !== 'string') return false;
  return token.length > 50 && token.includes('.') && token.startsWith('eyJ');
};

let client = null;
let configState = "missing";

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  if (isLikelyValidKey(SUPABASE_ANON_KEY)) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      configState = "ready";
    } catch (err) {
      configState = "error";
    }
  } else {
    configState = "invalid_format";
  }
}

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
    update: () => ({ eq: () => Promise.reject(new Error("Supabase not configured")) }),
    delete: () => ({ eq: () => Promise.reject(new Error("Supabase not configured")) })
  }),
  storage: { from: () => ({ upload: () => Promise.reject(new Error("Supabase not configured")), createSignedUrl: () => Promise.resolve({ data: null }), remove: () => Promise.reject(new Error("Supabase not configured")) }) },
  rpc: () => Promise.reject(new Error("Supabase not configured"))
};

export const isSupabaseConfigured = configState === "ready";
export const supabaseConfigError = configState;
export const STORAGE_BUCKET = "lockflow-content";
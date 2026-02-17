
import { createClient } from "@supabase/supabase-js";

// Supabase project configuration
const SUPABASE_URL = "https://gdoklosrdlxogtdrywhi.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_WVkMtDdclClWRdQmx4sTQA_wMlDccgk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
export const STORAGE_BUCKET = "Lockflow";

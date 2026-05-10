import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings (or .env.local for dev).",
    );
  }
  _client = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return _client;
}

export type DemoRequestPayload = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
};

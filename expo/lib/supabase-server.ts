import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el backend (rutas admin de tRPC).
 * Usa la SERVICE ROLE KEY si está configurada (bypasea RLS y permite
 * al panel admin ver todos los clientes/comercios); si no, cae a la
 * anon key (las consultas quedan limitadas por RLS).
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("⚠️ [supabase-server] Falta EXPO_PUBLIC_SUPABASE_URL");
}

if (!serviceKey) {
  console.warn(
    "⚠️ [supabase-server] Sin SUPABASE_SERVICE_ROLE_KEY: las consultas admin respetan RLS (no verán perfiles ajenos)."
  );
}

export const supabaseServer: SupabaseClient = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  serviceKey ?? anonKey ?? "public-anon-key-placeholder",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export const tieneServiceRole = Boolean(serviceKey);

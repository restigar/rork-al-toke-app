import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Valores del proyecto Al Toke como respaldo: la clave anon es pública
 * (publishable), por lo que puede ir incluida en el bundle sin riesgo.
 * Garantiza que la app funcione aunque las variables de entorno no se
 * hayan inyectado (ej: Metro sin reiniciar tras cambiar el .env).
 */
const SUPABASE_URL_RESPALDO = 'https://qgmnxdihmyiqvfbcxxqs.supabase.co';
const SUPABASE_ANON_KEY_RESPALDO = 'sb_publishable_NgWfAFnDC3E9DmBOARaRug_JTV0NPSk';

const urlFinal = supabaseUrl ?? SUPABASE_URL_RESPALDO;
const keyFinal = supabaseAnonKey ?? SUPABASE_ANON_KEY_RESPALDO;

if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase configurado con variables de entorno');
} else {
  console.warn('⚠️ Variables de entorno de Supabase ausentes: usando valores de respaldo del proyecto.');
}

/** Indica si las credenciales de Supabase están disponibles. */
export const isSupabaseConfigured = Boolean(urlFinal && keyFinal);

/**
 * Cliente de Supabase compartido por la app (Auth, Database y Storage).
 * Usa variables EXPO_PUBLIC_* que se inyectan en el bundle del cliente.
 */
export const supabase = createClient(
  urlFinal,
  keyFinal,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

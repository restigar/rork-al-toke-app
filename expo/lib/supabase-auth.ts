import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Usuario normalizado que devuelven las funciones de autenticación.
 * Mantiene la misma forma que usaban las pantallas con Firebase
 * (uid, email, displayName, photoURL) para minimizar cambios.
 */
export interface UsuarioAuth {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** Convierte un usuario de Supabase Auth al formato normalizado de la app. */
const normalizarUsuario = (user: any): UsuarioAuth | null => {
  if (!user?.id) return null;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: user.user_metadata?.nombre_completo ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    photoURL: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
  };
};

/**
 * Traduce los errores técnicos de Supabase Auth a mensajes claros en español.
 */
export const mensajeAmigable = (error: any): string => {
  const codigo: string = error?.code || '';
  const texto: string = error?.message || '';

  const mensajes: Record<string, string> = {
    'invalid_credentials': 'Email o contraseña incorrectos.',
    'user_already_registered': 'Ese email ya está registrado. Iniciá sesión con esa cuenta o usá otro email.',
    'email_not_confirmed': 'Tu email aún no fue confirmado. Revisá tu casilla (y spam) y hacé clic en el enlace de confirmación.',
    'user_banned': 'Esta cuenta fue deshabilitada. Contactá a soporte.',
    'user_not_found': 'No existe una cuenta con ese email.',
    'weak_password': 'La contraseña es muy débil. Usá al menos 6 caracteres.',
    'over_request_rate_limit': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
    'over_email_send_rate_limit': 'Se enviaron demasiados emails. Esperá unos minutos y probá de nuevo.',
    'email_address_invalid': 'El formato del email no es válido.',
    'email_exists': 'Ese email ya está registrado. Iniciá sesión con esa cuenta o usá otro email.',
    'signup_disabled': 'El registro está temporalmente deshabilitado. Contactá a soporte.',
  };

  if (codigo && mensajes[codigo]) {
    return mensajes[codigo];
  }

  if (texto.includes('already registered') || texto.includes('already been registered')) {
    return mensajes['user_already_registered']!;
  }
  if (texto.includes('Invalid login credentials')) {
    return mensajes['invalid_credentials']!;
  }
  if (texto.includes('Email not confirmed')) {
    return mensajes['email_not_confirmed']!;
  }
  if (texto.includes('rate limit')) {
    return mensajes['over_request_rate_limit']!;
  }
  if (texto.includes('at least 6 characters')) {
    return mensajes['weak_password']!;
  }
  if (texto.includes('Database error saving new user')) {
    return 'No se pudo completar el registro. Intentá de nuevo en unos minutos; si persiste, contactá a soporte.';
  }
  if (texto.toLowerCase().includes('fetch') || texto.toLowerCase().includes('network')) {
    return 'Sin conexión a internet. Verificá tu conexión e intentá de nuevo.';
  }

  return texto || 'Ocurrió un error inesperado. Intentá de nuevo.';
};

/** Inicia sesión con email y contraseña. */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ Error al iniciar sesión:', error.message);
      return { user: null, error: mensajeAmigable(error) };
    }
    const user = normalizarUsuario(data.user);
    console.log('✅ Usuario autenticado:', user?.uid);
    return { user, error: null };
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión:', error?.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

/**
 * Registra un usuario. Los `metadata` viajan en `raw_user_meta_data`
 * y el trigger de Supabase (crear_perfil_usuario) crea automáticamente
 * la fila en `clientes` o `comercios` según el campo `type`.
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string,
  metadata?: Record<string, unknown>
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...(displayName ? { nombre_completo: displayName } : {}),
          ...(metadata ?? {}),
        },
      },
    });

    if (error) {
      console.error('❌ Error al registrar usuario:', error.message);
      return { user: null, error: mensajeAmigable(error) };
    }

    const user = normalizarUsuario(data.user);
    console.log('✅ Usuario registrado:', user?.uid, '| sesión:', Boolean(data.session));

    // Si Supabase exige confirmar email, no hay sesión activa.
    if (!data.session) {
      return {
        user,
        error: 'Cuenta creada. Revisá tu casilla de email y confirmá el registro para iniciar sesión.',
      };
    }

    return { user, error: null };
  } catch (error: any) {
    console.error('❌ Error al registrar usuario:', error?.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

/** Cierra la sesión actual. */
export const signOut = async () => {
  try {
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada');
    return { error: null };
  } catch (error: any) {
    console.error('❌ Error al cerrar sesión:', error.message);
    return { error: error.message };
  }
};

/** Envía un email para restablecer la contraseña. */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('❌ Error al enviar email de recuperación:', error.message);
      return { error: mensajeAmigable(error) };
    }
    console.log('✅ Email de recuperación enviado');
    return { error: null };
  } catch (error: any) {
    console.error('❌ Error al enviar email de recuperación:', error.message);
    return { error: mensajeAmigable(error) };
  }
};

/** Devuelve el usuario de la sesión activa (o null). */
export const obtenerSesionActual = async (): Promise<UsuarioAuth | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return normalizarUsuario(data.session?.user ?? null);
  } catch (error) {
    console.error('❌ Error al obtener sesión actual:', error);
    return null;
  }
};

/**
 * Se suscribe a los cambios de autenticación (login, logout, sesión restaurada).
 * Devuelve la función para desuscribirse.
 */
export const subscribeToAuthChanges = (callback: (user: UsuarioAuth | null) => void) => {
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    callback(normalizarUsuario(sesion?.user ?? null));
  });
  return () => {
    data.subscription.unsubscribe();
  };
};

/**
 * Inicia sesión con Google (solo web; en móvil requiere configuración
 * adicional de OAuth en Supabase, igual que antes con Firebase).
 */
export const signInWithGoogle = async (): Promise<{ user: UsuarioAuth | null; error: string | null }> => {
  try {
    if (Platform.OS !== 'web') {
      console.log('ℹ️ Google Sign-In en móvil requiere configuración adicional');
      return { user: null, error: 'Google Sign-In solo disponible en web por ahora' };
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      console.error('❌ Error al iniciar sesión con Google:', error.message);
      return { user: null, error: mensajeAmigable(error) };
    }
    // En web redirige al proveedor; la sesión se retoma al volver.
    return { user: null, error: null };
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión con Google:', error.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

/**
 * Inicia sesión con Apple (solo web; en móvil requiere configuración
 * adicional de OAuth en Supabase).
 */
export const signInWithApple = async (): Promise<{ user: UsuarioAuth | null; error: string | null }> => {
  try {
    if (Platform.OS !== 'web') {
      console.log('ℹ️ Apple Sign-In en móvil requiere configuración adicional');
      return { user: null, error: 'Apple Sign-In solo disponible en web por ahora' };
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
    if (error) {
      console.error('❌ Error al iniciar sesión con Apple:', error.message);
      return { user: null, error: mensajeAmigable(error) };
    }
    // En web redirige al proveedor; la sesión se retoma al volver.
    return { user: null, error: null };
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión con Apple:', error.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

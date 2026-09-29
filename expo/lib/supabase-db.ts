import { supabase } from './supabase';
import type { DiaHorario } from '../types';

/**
 * Módulo de base de datos sobre Supabase (reemplaza a Firestore).
 * Los perfiles viven en las tablas `clientes` y `comercios`, y cada
 * fila comparte el id con el usuario de Supabase Auth (RLS por dueño).
 */

export interface PerfilClienteDB {
  id: string;
  email: string;
  name: string;
  type: 'cliente';
  number?: string;
  numeroCliente?: string;
  fotoPerfil?: string;
  telefono?: string;
  ciudad?: string;
  estado?: string;
}

export interface PerfilComercioDB {
  id: string;
  email: string;
  name: string;
  nombre: string;
  type: 'comercio';
  number?: string;
  numeroComercio?: string;
  telefono?: string;
  tipo?: string;
  rubro?: string;
  subRubro?: string;
  fotoPerfil?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
  ubicacion?: { latitud: number; longitud: number; calle: string; ciudad: string };
  horarios?: DiaHorario[];
  estaDeTurno?: boolean;
  estado?: string;
}

export type PerfilUsuario = PerfilClienteDB | PerfilComercioDB;

/** Convierte una fila de `comercios` (snake_case) al formato de la app. */
const mapearComercio = (fila: Record<string, any>): PerfilComercioDB => ({
  id: fila.id,
  email: fila.email ?? '',
  name: fila.nombre ?? 'Comercio',
  nombre: fila.nombre ?? 'Comercio',
  type: 'comercio',
  number: fila.numero_comercio ?? undefined,
  numeroComercio: fila.numero_comercio ?? undefined,
  telefono: fila.telefono ?? undefined,
  tipo: fila.tipo ?? undefined,
  rubro: fila.rubro ?? undefined,
  subRubro: fila.sub_rubro ?? undefined,
  fotoPerfil: fila.foto_perfil ?? undefined,
  facebook: fila.facebook ?? undefined,
  instagram: fila.instagram ?? undefined,
  website: fila.website ?? undefined,
  ubicacion:
    fila.latitud != null && fila.longitud != null
      ? {
          latitud: fila.latitud,
          longitud: fila.longitud,
          calle: fila.calle ?? '',
          ciudad: fila.ciudad ?? '',
        }
      : undefined,
  horarios: Array.isArray(fila.horarios) ? (fila.horarios as DiaHorario[]) : [],
  estaDeTurno: fila.esta_de_turno ?? false,
  estado: fila.estado ?? 'Activo',
});

/** Convierte una fila de `clientes` (snake_case) al formato de la app. */
const mapearCliente = (fila: Record<string, any>): PerfilClienteDB => ({
  id: fila.id,
  email: fila.email ?? '',
  name: [fila.nombre, fila.apellido].filter(Boolean).join(' ').trim() || 'Usuario',
  type: 'cliente',
  number: fila.numero_cliente ?? undefined,
  numeroCliente: fila.numero_cliente ?? undefined,
  fotoPerfil: fila.foto_perfil ?? undefined,
  telefono: fila.telefono ?? undefined,
  ciudad: fila.ciudad ?? undefined,
  estado: fila.estado ?? 'Activo',
});

/**
 * Devuelve el perfil completo del usuario desde Supabase.
 * Busca primero en `comercios` (lectura pública) y luego en `clientes`
 * (solo el propio, gracias a RLS).
 */
export const getPerfil = async (
  uid: string
): Promise<{ data: PerfilUsuario | null; error: string | null }> => {
  try {
    const { data: filaComercio } = await supabase
      .from('comercios')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (filaComercio) {
      console.log('✅ Perfil de comercio obtenido de Supabase:', uid);
      return { data: mapearComercio(filaComercio), error: null };
    }

    const { data: filaCliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (filaCliente) {
      console.log('✅ Perfil de cliente obtenido de Supabase:', uid);
      return { data: mapearCliente(filaCliente), error: null };
    }

    return { data: null, error: error?.message ?? 'Perfil no encontrado' };
  } catch (error: any) {
    console.error('❌ Error al obtener perfil de Supabase:', error?.message);
    return { data: null, error: error?.message ?? 'Error al obtener perfil' };
  }
};

/**
 * Actualiza campos del perfil propio en Supabase.
 * `datos` usa los nombres de columna de la tabla (snake_case).
 */
export const actualizarPerfil = async (
  uid: string,
  tipo: 'cliente' | 'comercio',
  datos: Record<string, unknown>
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const tabla = tipo === 'cliente' ? 'clientes' : 'comercios';
    const { error } = await supabase.from(tabla).update(datos).eq('id', uid);
    if (error) {
      console.error(`❌ Error al actualizar perfil en ${tabla}:`, error.message);
      return { success: false, error: error.message };
    }
    console.log(`✅ Perfil actualizado en ${tabla}:`, uid);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('❌ Error al actualizar perfil:', error?.message);
    return { success: false, error: error?.message ?? 'Error al actualizar perfil' };
  }
};

/**
 * Completa el perfil de cliente creado por el trigger (usado al
 * registrarse con Google/Apple, donde no hay metadata de formulario).
 */
export const completarPerfilCliente = async (
  uid: string,
  nombre: string,
  fotoUrl?: string
): Promise<{ success: boolean; error: string | null }> => {
  return actualizarPerfil(uid, 'cliente', {
    nombre,
    ...(fotoUrl ? { foto_perfil: fotoUrl } : {}),
  });
};

/**
 * Crea (o completa) el perfil de comercio para un usuario registrado
 * vía Google/Apple, que el trigger pudo haber creado como cliente.
 */
export const crearPerfilComercio = async (
  uid: string,
  nombre: string,
  email: string,
  telefono?: string,
  fotoUrl?: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.from('comercios').upsert({
      id: uid,
      nombre,
      email,
      ...(telefono ? { telefono } : {}),
      ...(fotoUrl ? { foto_perfil: fotoUrl } : {}),
    });
    if (error) {
      console.error('❌ Error al crear perfil de comercio:', error.message);
      return { success: false, error: error.message };
    }
    console.log('✅ Perfil de comercio creado/actualizado:', uid);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('❌ Error al crear perfil de comercio:', error?.message);
    return { success: false, error: error?.message ?? 'Error al crear perfil' };
  }
};

/** Lee la configuración de versiones desde la tabla `app_config`. */
export const getConfigVersion = async (): Promise<{
  data: unknown;
  error: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('valor')
      .eq('clave', 'version')
      .maybeSingle();

    if (error) {
      console.warn('⚠️ No se pudo leer app_config:', error.message);
      return { data: null, error: error.message };
    }

    return { data: data?.valor ?? null, error: null };
  } catch (error: any) {
    console.warn('⚠️ Error leyendo app_config:', error?.message);
    return { data: null, error: error?.message ?? 'Error' };
  }
};

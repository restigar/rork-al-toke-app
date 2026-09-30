import { supabase, isSupabaseConfigured } from './supabase';
import type { Oferta, OfertaDelDia } from '../types';

/**
 * Sincronización de ofertas con Supabase.
 * Las ofertas (de comercios y del día de clientes) viven en las tablas
 * public.ofertas y public.ofertas_del_dia, y sus fotos/videos en el bucket
 * público "ofertas-public". Así lo que publica un celular lo ven todos.
 */

export const BUCKET_OFERTAS = 'ofertas-public';

const MAX_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB (tope para videos)

/** Fila de public.ofertas tal como viene de PostgREST. */
interface OfertaRow {
  id: string;
  comercio_id: string;
  comercio_nombre: string;
  titulo: string;
  descripcion: string;
  precio: number | string;
  vigencia_inicio: string;
  vigencia_fin: string;
  imagen_url: string | null;
}

/** Fila de public.ofertas_del_dia tal como viene de PostgREST. */
interface OfertaDiaRow {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  titulo: string;
  descripcion: string;
  precio: number | string;
  fecha: string;
  imagen_url: string | null;
  direccion: string | null;
  numero_contacto: string | null;
  ubicacion: OfertaDelDia['ubicacion'] | null;
}

function aNumero(valor: number | string): number {
  return typeof valor === 'number' ? valor : Number(valor) || 0;
}

function filaAOferta(row: OfertaRow): Oferta {
  return {
    id: row.id,
    comercioId: row.comercio_id,
    comercioNombre: row.comercio_nombre,
    titulo: row.titulo,
    descripcion: row.descripcion,
    precio: aNumero(row.precio),
    vigenciaInicio: row.vigencia_inicio,
    vigenciaFin: row.vigencia_fin,
    imagenUrl: row.imagen_url ?? undefined,
  };
}

function filaAOfertaDia(row: OfertaDiaRow): OfertaDelDia {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNombre: row.cliente_nombre,
    titulo: row.titulo,
    descripcion: row.descripcion,
    precio: aNumero(row.precio),
    fecha: row.fecha,
    imagenUrl: row.imagen_url ?? undefined,
    direccion: row.direccion ?? undefined,
    numeroContacto: row.numero_contacto ?? undefined,
    ubicacion: row.ubicacion ?? undefined,
  };
}

/**
 * Sube la foto/video de una oferta (URI local) al bucket público
 * y devuelve la URL pública para que cualquier celular la vea.
 * Si el URI ya es una URL remota o algo falla, lo devuelve sin cambios
 * (la oferta se guarda igual, solo quedaría sin media accesible).
 */
export async function subirMediaOferta(uri: string, ownerId: string): Promise<string> {
  if (!uri || uri.startsWith('http')) {
    return uri;
  }

  if (!isSupabaseConfigured || !ownerId) {
    return uri;
  }

  try {
    const response = await fetch(uri);
    if (!response.ok) {
      return uri;
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_MEDIA_BYTES) {
      return uri;
    }

    const extension = (uri.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const mime = extension === 'mp4' || extension === 'mov'
      ? `video/${extension === 'mov' ? 'quicktime' : 'mp4'}`
      : extension === 'png' ? 'image/png' : 'image/jpeg';

    const storagePath = `ofertas/${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET_OFERTAS)
      .upload(storagePath, buffer, { contentType: mime, upsert: false });

    if (error) {
      console.error('Error subiendo media de oferta:', error.message);
      return uri;
    }

    const { data } = supabase.storage.from(BUCKET_OFERTAS).getPublicUrl(storagePath);
    return data.publicUrl || uri;
  } catch (error) {
    console.error('Error leyendo media de oferta:', error);
    return uri;
  }
}

/** Guarda (crea o actualiza) una oferta de comercio en Supabase. */
export async function guardarOfertaRemota(oferta: Oferta): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado.');
  }

  const imagenUrl = await subirMediaOferta(oferta.imagenUrl ?? '', oferta.comercioId);

  const { error } = await supabase.from('ofertas').upsert({
    id: oferta.id,
    comercio_id: oferta.comercioId,
    comercio_nombre: oferta.comercioNombre,
    titulo: oferta.titulo,
    descripcion: oferta.descripcion,
    precio: oferta.precio,
    vigencia_inicio: oferta.vigenciaInicio,
    vigencia_fin: oferta.vigenciaFin,
    imagen_url: imagenUrl || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Guarda (crea o actualiza) una oferta del día de cliente en Supabase. */
export async function guardarOfertaDiaRemota(oferta: OfertaDelDia): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado.');
  }

  const imagenUrl = await subirMediaOferta(oferta.imagenUrl ?? '', oferta.clienteId);

  const { error } = await supabase.from('ofertas_del_dia').upsert({
    id: oferta.id,
    cliente_id: oferta.clienteId,
    cliente_nombre: oferta.clienteNombre,
    titulo: oferta.titulo,
    descripcion: oferta.descripcion,
    precio: oferta.precio,
    fecha: oferta.fecha,
    imagen_url: imagenUrl || null,
    direccion: oferta.direccion ?? null,
    numero_contacto: oferta.numeroContacto ?? null,
    ubicacion: oferta.ubicacion ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Elimina una oferta de comercio en Supabase. */
export async function eliminarOfertaRemota(ofertaId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    return;
  }
  const { error } = await supabase.from('ofertas').delete().eq('id', ofertaId);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Descarga todas las ofertas de comercios.
 * Devuelve null si Supabase no está disponible (para conservar la caché local).
 */
export async function cargarOfertas(): Promise<Oferta[] | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { data, error } = await supabase
    .from('ofertas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error cargando ofertas:', error.message);
    return null;
  }
  return ((data ?? []) as OfertaRow[]).map(filaAOferta);
}

/**
 * Descarga todas las ofertas del día.
 * Devuelve null si Supabase no está disponible (para conservar la caché local).
 */
export async function cargarOfertasDia(): Promise<OfertaDelDia[] | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { data, error } = await supabase
    .from('ofertas_del_dia')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error cargando ofertas del día:', error.message);
    return null;
  }
  return ((data ?? []) as OfertaDiaRow[]).map(filaAOfertaDia);
}

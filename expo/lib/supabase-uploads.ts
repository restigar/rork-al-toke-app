import { supabase, isSupabaseConfigured } from './supabase';

/** Rol del dueño del archivo. */
export type OwnerRole = 'cliente' | 'comercio';

/** Tipo de archivo. */
export type UploadTipo = 'imagen' | 'video';

/** Fila de la tabla public.user_uploads. */
export interface UserUploadRow {
  id: string;
  owner_id: string;
  owner_role: OwnerRole;
  tipo: UploadTipo;
  url_path: string;
  mime_type: string | null;
  is_public: boolean;
  created_at: string;
}

/** Fila de user_uploads con su URL lista para mostrar. */
export interface UserUploadConUrl extends UserUploadRow {
  url: string | null;
}

/** Límites de tamaño por tipo (en bytes). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB

/** Vigencia de las URLs firmadas para archivos privados de clientes. */
const SIGNED_URL_SECONDS = 60 * 60; // 1 hora

export const BUCKET_CLIENTES = 'clientes-private';
export const BUCKET_COMERCIOS = 'comercios-public';

// Formatos permitidos (jpg, png para fotos; mp4 y mov de iOS para videos)
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime'];

/** Asset mínimo que la app necesita de expo-image-picker. */
export interface PickerAsset {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

/** Archivo ya leído y validado, listo para subir. */
export interface ArchivoValidado {
  buffer: ArrayBuffer;
  mimeType: string;
  tipo: UploadTipo;
  fileName: string;
}

function extensionDe(uri: string, fileName?: string | null): string {
  const fuente = fileName || uri.split('?')[0] || '';
  const partes = fuente.split('.');
  return partes.length > 1 ? (partes[partes.length - 1] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

function limpiarNombre(nombre: string): string {
  const limpio = nombre.toLowerCase().replace(/[^a-z0-9._-]/g, '_').slice(-60);
  return limpio || 'archivo';
}

/**
 * Lee el asset del picker (funciona en iOS, Android y web) y valida:
 * formato permitido (JPG/PNG/MP4) y límite de tamaño (10 MB fotos, 50 MB videos).
 */
export async function validarYLeerArchivo(asset: PickerAsset): Promise<ArchivoValidado> {
  const extension = extensionDe(asset.uri, asset.fileName);

  let mimeType = asset.mimeType || '';
  if (!mimeType) {
    if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
    else if (extension === 'png') mimeType = 'image/png';
    else if (extension === 'mp4') mimeType = 'video/mp4';
    else if (extension === 'mov') mimeType = 'video/quicktime';
  }

  const esImagen = ALLOWED_IMAGE_MIMES.includes(mimeType);
  const esVideo = ALLOWED_VIDEO_MIMES.includes(mimeType);

  if (!esImagen && !esVideo) {
    throw new Error('Formato no permitido. Usá fotos JPG o PNG y videos MP4.');
  }

  // fetch() soporta URIs locales (file://) en nativo y blob: en web
  const response = await fetch(asset.uri);
  if (!response.ok) {
    throw new Error('No se pudo leer el archivo seleccionado.');
  }
  const buffer = await response.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw new Error('El archivo está vacío o dañado.');
  }

  const maxBytes = esImagen ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (buffer.byteLength > maxBytes) {
    const pesoMb = (buffer.byteLength / (1024 * 1024)).toFixed(1);
    const limiteMb = esImagen ? 10 : 50;
    throw new Error(`El archivo pesa ${pesoMb} MB y supera el límite de ${limiteMb} MB.`);
  }

  const tipo: UploadTipo = esImagen ? 'imagen' : 'video';
  const extensionFinal = extension || (esImagen ? 'jpg' : 'mp4');
  const fileName = `${Date.now()}-${limpiarNombre(asset.fileName || `archivo.${extensionFinal}`)}`;

  return { buffer, mimeType, tipo, fileName };
}

/** Ruta del objeto dentro del bucket (sin el bucket ni la carpeta raíz). */
function storagePathDe(urlPath: string): string {
  return urlPath.replace(/^(clientes|comercios)\//, '');
}

/** URL pública (solo bucket comercios-public). */
export function obtenerUrlPublica(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET_COMERCIOS).getPublicUrl(storagePath);
  return data.publicUrl;
}

/** URL firmada temporal (bucket privado de clientes). */
export async function crearUrlFirmada(storagePath: string, segundos = SIGNED_URL_SECONDS): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET_CLIENTES).createSignedUrl(storagePath, segundos);
  if (error) {
    console.error('Error creando URL firmada:', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Devuelve la URL correcta según el rol (pública para comercios, firmada para clientes). */
export async function urlPara(row: UserUploadRow): Promise<string | null> {
  const storagePath = storagePathDe(row.url_path);
  return row.owner_role === 'cliente' ? crearUrlFirmada(storagePath) : obtenerUrlPublica(storagePath);
}

/**
 * Flujo completo de subida:
 * 1. Valida y lee el archivo.
 * 2. Lo sube al bucket correspondiente (clientes-private / comercios-public)
 *    en la ruta `<rol>/<auth.uid>/...`.
 * 3. Guarda los metadatos en public.user_uploads (si falla, borra el objeto huérfano).
 * 4. Devuelve la fila con su URL (pública o firmada según el rol).
 */
export async function subirArchivo(params: {
  asset: PickerAsset;
  ownerId: string;
  ownerRole: OwnerRole;
}): Promise<UserUploadConUrl> {
  const { asset, ownerId, ownerRole } = params;

  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado en esta build (faltan las variables de entorno).');
  }

  const archivo = await validarYLeerArchivo(asset);

  const esCliente = ownerRole === 'cliente';
  const bucket = esCliente ? BUCKET_CLIENTES : BUCKET_COMERCIOS;
  const carpeta = esCliente ? 'clientes' : 'comercios';
  const storagePath = `${ownerId}/${archivo.fileName}`;
  const urlPath = `${carpeta}/${ownerId}/${archivo.fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, archivo.buffer, {
      contentType: archivo.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`No se pudo subir el archivo: ${uploadError.message}`);
  }

  const { data: insertada, error: insertError } = await supabase
    .from('user_uploads')
    .insert({
      owner_id: ownerId,
      owner_role: ownerRole,
      tipo: archivo.tipo,
      url_path: urlPath,
      mime_type: archivo.mimeType,
      is_public: !esCliente,
    })
    .select()
    .single();

  if (insertError || !insertada) {
    // Rollback: no dejar el objeto en Storage sin su registro en la base
    await supabase.storage.from(bucket).remove([storagePath]);
    throw new Error(`No se pudieron guardar los datos del archivo: ${insertError?.message ?? 'error desconocido'}`);
  }

  const row = insertada as UserUploadRow;
  const url = esCliente ? await crearUrlFirmada(storagePath) : obtenerUrlPublica(storagePath);
  return { ...row, url };
}

/**
 * Sube la foto de perfil al bucket público (comercios-public, carpeta propia
 * del usuario) y devuelve la URL pública permanente.
 * Si algo falla, devuelve el URI original (fail-open).
 */
export async function subirFotoPerfil(uri: string, uid: string): Promise<string> {
  if (!uri || uri.startsWith('http') || !isSupabaseConfigured || !uid) {
    return uri;
  }

  try {
    const response = await fetch(uri);
    if (!response.ok) {
      return uri;
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      return uri;
    }

    const extension = (uri.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
    const storagePath = `${uid}/perfil-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET_COMERCIOS)
      .upload(storagePath, buffer, { contentType: mime, upsert: true });

    if (error) {
      console.log('ℹ️ No se pudo subir la foto de perfil:', error.message);
      return uri;
    }

    const { data } = supabase.storage.from(BUCKET_COMERCIOS).getPublicUrl(storagePath);
    return data.publicUrl || uri;
  } catch {
    return uri;
  }
}

/**
 * Lista los archivos de un dueño con su URL lista para mostrar.
 * Para comercios se acepta llamar sin ownerRole (cualquier usuario autenticado
 * puede leer las filas públicas gracias a RLS).
 */
export async function listarArchivos(ownerId: string, ownerRole?: OwnerRole): Promise<UserUploadConUrl[]> {
  let query = supabase
    .from('user_uploads')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (ownerRole) {
    query = query.eq('owner_role', ownerRole);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`No se pudieron cargar los archivos: ${error.message}`);
  }

  const filas = (data ?? []) as UserUploadRow[];
  return Promise.all(filas.map(async (row) => ({ ...row, url: await urlPara(row) })));
}

/** Elimina el objeto de Storage y su fila en user_uploads. */
export async function eliminarArchivo(row: UserUploadRow): Promise<void> {
  const bucket = row.owner_role === 'cliente' ? BUCKET_CLIENTES : BUCKET_COMERCIOS;
  const storagePath = storagePathDe(row.url_path);

  const { error: storageError } = await supabase.storage.from(bucket).remove([storagePath]);
  if (storageError) {
    console.error('Error eliminando objeto de Storage:', storageError.message);
  }

  const { error } = await supabase.from('user_uploads').delete().eq('id', row.id);
  if (error) {
    throw new Error(`No se pudo eliminar el archivo: ${error.message}`);
  }
}

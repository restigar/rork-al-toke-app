import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { launchImageLibraryAsync, type MediaType } from 'expo-image-picker';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ImagePlus, Trash2, Play, AlertCircle } from 'lucide-react-native';
import { useUserUploads, useSubirArchivo, useEliminarArchivo } from '../hooks/useUserUploads';
import type { OwnerRole, UserUploadRow } from '../lib/supabase-uploads';

interface MediaUploaderProps {
  /** uid del usuario dueño (auth.uid()). */
  ownerId: string;
  /** 'cliente' usa el bucket privado, 'comercio' el público. */
  ownerRole: OwnerRole;
  /** Cantidad máxima de archivos permitida (por defecto 12). */
  maxFiles?: number;
}

/**
 * Selector y galería de archivos del perfil.
 * Permite elegir fotos/videos, los valida (JPG/PNG hasta 10 MB, MP4 hasta 50 MB),
 * los sube a Supabase Storage en la ruta del dueño y muestra/elimina los existentes.
 */
export default function MediaUploader({ ownerId, ownerRole, maxFiles = 12 }: MediaUploaderProps) {
  const [mensajeError, setMensajeError] = useState<string>('');
  const [confirmarBorradoId, setConfirmarBorradoId] = useState<string | null>(null);

  const { data: archivos, isLoading } = useUserUploads(ownerId, ownerRole);
  const subir = useSubirArchivo(ownerId, ownerRole);
  const eliminar = useEliminarArchivo(ownerId);

  const estaCompleto = (archivos?.length ?? 0) >= maxFiles;

  const elegirYSubir = async () => {
    setMensajeError('');
    setConfirmarBorradoId(null);

    try {
      const permiso = await launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'] as MediaType[],
        allowsMultipleSelection: false,
        quality: 0.9,
        videoMaxDuration: 180,
        selectionLimit: 1,
      });

      if (permiso.canceled || !permiso.assets?.length) return;

      const asset = permiso.assets[0];
      if (!asset) return;

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await subir.mutateAsync(asset);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      setMensajeError(error?.message || 'No se pudo subir el archivo. Intentá de nuevo.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const manejarBorrado = (row: UserUploadRow) => {
    if (confirmarBorradoId !== row.id) {
      setConfirmarBorradoId(row.id);
      return;
    }
    setConfirmarBorradoId(null);
    eliminar.mutate(row);
  };

  const abrirArchivo = (url: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => setMensajeError('No se pudo abrir el archivo.'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.titulo}>Mis fotos y videos</Text>
        <Text style={styles.contador}>
          {archivos?.length ?? 0}/{maxFiles}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#1a2332" style={styles.loader} />
      ) : (
        <View style={styles.grid}>
          {archivos?.map((archivo) => (
            <View key={archivo.id} style={styles.tile}>
              <TouchableOpacity
                style={styles.mediaBoton}
                onPress={() => abrirArchivo(archivo.url)}
                activeOpacity={0.85}
              >
                {archivo.tipo === 'imagen' ? (
                  <Image
                    source={{ uri: archivo.url ?? undefined }}
                    style={styles.media}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View style={[styles.media, styles.videoTile]}>
                    <Play size={28} color="#fff" fill="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.borrarBoton,
                  confirmarBorradoId === archivo.id && styles.borrarBotonConfirmar,
                ]}
                onPress={() => manejarBorrado(archivo)}
                disabled={eliminar.isPending}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color="#fff" />
                {confirmarBorradoId === archivo.id ? (
                  <Text style={styles.borrarTextoConfirmar}>¿Borrar?</Text>
                ) : null}
              </TouchableOpacity>
            </View>
          ))}

          {!estaCompleto ? (
            <TouchableOpacity
              style={[styles.botonAgregar, subir.isPending && styles.botonAgregarOcupado]}
              onPress={elegirYSubir}
              disabled={subir.isPending}
              activeOpacity={0.85}
            >
              {subir.isPending ? (
                <ActivityIndicator color="#9dd9c1" />
              ) : (
                <>
                  <ImagePlus size={24} color="#9dd9c1" />
                  <Text style={styles.botonAgregarTexto}>Agregar</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {mensajeError ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#b91c1c" />
          <Text style={styles.errorTexto}>{mensajeError}</Text>
        </View>
      ) : null}

      <Text style={styles.ayuda}>
        {ownerRole === 'comercio'
          ? 'Tus fotos y videos son visibles para los clientes de la app.'
          : 'Tus archivos son privados: solo vos podés verlos.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titulo: {
    fontSize: 17,
    fontWeight: 'bold' as const,
    color: '#1a2332',
  },
  contador: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600' as const,
  },
  loader: {
    paddingVertical: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: 96,
    height: 96,
  },
  mediaBoton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  videoTile: {
    backgroundColor: '#1a2332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrarBoton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  borrarBotonConfirmar: {
    backgroundColor: '#b91c1c',
  },
  borrarTextoConfirmar: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  botonAgregar: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9dd9c1',
    borderStyle: 'dashed' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  botonAgregarOcupado: {
    opacity: 0.7,
  },
  botonAgregarTexto: {
    fontSize: 12,
    color: '#1a2332',
    fontWeight: '600' as const,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  errorTexto: {
    flex: 1,
    color: '#b91c1c',
    fontSize: 13,
  },
  ayuda: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 12,
    lineHeight: 17,
  },
});

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

/**
 * Muestra una oferta con imagen o video según el archivo.
 * Si el URI es un video (.mp4/.mov/etc. o tipo declarado 'video'),
 * renderiza un reproductor; si no, una imagen.
 */

const EXTENSIONES_VIDEO = /\.(mp4|mov|m4v|webm|avi|3gp)$/i;

/** Indica si un URI corresponde a un archivo de video. */
export function esVideo(uri: string): boolean {
  return EXTENSIONES_VIDEO.test(uri);
}

interface OfertaMediaProps {
  uri: string;
  tipo?: 'imagen' | 'video';
  style: StyleProp<ViewStyle>;
}

function OfertaVideo({ uri, style }: { uri: string; style: StyleProp<ViewStyle> }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  return (
    <View style={[style, styles.contenedorVideo]}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
      />
    </View>
  );
}

export default function OfertaMedia({ uri, tipo, style }: OfertaMediaProps) {
  if (!uri) {
    return null;
  }

  const esVideoArchivo = tipo === 'video' || esVideo(uri);

  if (esVideoArchivo) {
    return <OfertaVideo uri={uri} style={style} />;
  }

  return <Image source={{ uri }} style={style} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  contenedorVideo: {
    overflow: 'hidden',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

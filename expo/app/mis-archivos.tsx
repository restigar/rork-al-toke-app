import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, CloudOff, LogIn } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import MediaUploader from '../components/MediaUploader';
import { isSupabaseConfigured } from '../lib/supabase';
import type { OwnerRole } from '../lib/supabase-uploads';

/**
 * Pantalla de ejemplo del sistema de archivos.
 * Muestra el componente MediaUploader conectado al usuario logueado:
 * - clientes  → bucket privado (solo ellos ven sus archivos)
 * - comercios → bucket público (los clientes pueden verlos)
 */
export default function MisArchivosScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const ownerRole: OwnerRole = user?.type === 'comercio' ? 'comercio' : 'cliente';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a2332" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Mis archivos</Text>
      </View>

      {!isSupabaseConfigured ? (
        <View style={styles.avisoContainer}>
          <CloudOff size={20} color="#b45309" />
          <Text style={styles.avisoTexto}>
            Supabase no está configurado en esta build. Agregá EXPO_PUBLIC_SUPABASE_URL y
            EXPO_PUBLIC_SUPABASE_ANON_KEY en el archivo "env" y recargá la app.
          </Text>
        </View>
      ) : null}

      {user ? (
        <MediaUploader ownerId={user.id} ownerRole={ownerRole} />
      ) : (
        <View style={styles.sinSesion}>
          <LogIn size={32} color="#9ca3af" />
          <Text style={styles.sinSesionTitulo}>Iniciá sesión</Text>
          <Text style={styles.sinSesionTexto}>
            Necesitás una cuenta para subir y gestionar tus archivos.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#1a2332',
  },
  avisoContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  avisoTexto: {
    flex: 1,
    color: '#92400e',
    fontSize: 13,
    lineHeight: 18,
  },
  sinSesion: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  sinSesionTitulo: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1a2332',
  },
  sinSesionTexto: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

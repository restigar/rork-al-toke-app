import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Store,
  FileText,
  Tag,
  List,
  Eye,
  AlertCircle,
  Settings,
  MessageCircle,
  Mail,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import type { Comercio } from '../../types';
import LocationPermissionModal from '../../components/LocationPermissionModal';

export default function ComercioDashboard() {
  const router = useRouter();
  const { user, logout, showLocationPrompt, requestLocationPermission, skipLocationPermission } = useAuth();
  const { getComercio } = useBusiness();
  const comercio = getComercio(user?.id || '') as Comercio;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const toggleDeTurno = () => {
    router.push('/comercio/marcar-turno');
  };

  const isFarmacia = comercio?.rubro === 'Salud y Cuidado Personal' && 
                     comercio?.subRubro === 'Farmacia';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>Panel de Comercio</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/comercio/editar-perfil')}
          >
            <Settings size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerLogoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {comercio?.fotoPerfil ? (
              <Image
                source={{ uri: comercio.fotoPerfil }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarContainer}>
                <Store size={48} color="#1a2332" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{comercio?.nombre || user?.name}</Text>
              <Text style={styles.profileNumber}>N° {comercio?.numeroComercio}</Text>
            </View>
          </View>

          <View style={styles.contactButtonsContainer}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => {
                const phoneNumber = '5493756441056';
                Linking.openURL(`https://wa.me/${phoneNumber}`);
              }}
            >
              <MessageCircle size={20} color="#25D366" />
              <Text style={styles.contactButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => {
                Linking.openURL('mailto:info@al-toke.com');
              }}
            >
              <Mail size={20} color="#EA4335" />
              <Text style={styles.contactButtonText}>Correo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          {isFarmacia && (
            <TouchableOpacity style={styles.actionCard} onPress={toggleDeTurno}>
              <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                <AlertCircle size={32} color="#f59e0b" />
              </View>
              <Text style={styles.actionTitle}>Marcar &quot;De Turno&quot;</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/comercio/cargar-oferta')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
              <Tag size={32} color="#16a34a" />
            </View>
            <Text style={styles.actionTitle}>Cargar Ofertas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/comercio/informacion')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#dbeafe' }]}>
              <FileText size={32} color="#2563eb" />
            </View>
            <Text style={styles.actionTitle}>Información de Comercio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/comercio/ofertas-activas')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
              <List size={32} color="#f59e0b" />
            </View>
            <Text style={styles.actionTitle}>Ofertas Activas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/cliente/perfil')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e9d5ff' }]}>
              <Eye size={32} color="#9333ea" />
            </View>
            <Text style={styles.actionTitle}>Ver como Cliente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LocationPermissionModal
        visible={showLocationPrompt}
        onAllow={requestLocationPermission}
        onSkip={skipLocationPermission}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 24,
    backgroundColor: '#1a2332',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
  },
  headerLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e5e9f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 4,
  },
  profileNumber: {
    fontSize: 16,
    color: '#6b7280',
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  contactButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
});

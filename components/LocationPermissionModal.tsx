import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface LocationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export default function LocationPermissionModal({ visible, onAllow, onSkip }: LocationPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        )}
        
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <MapPin size={40} color="#9dd9c1" strokeWidth={2.5} />
              </View>
            </View>

            <Text style={styles.title}>Activar Ubicación</Text>
            <Text style={styles.description}>
              Permite que Al Toke acceda a tu ubicación para encontrar comercios y ofertas cerca de vos
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <Navigation size={18} color="#9dd9c1" />
                <Text style={styles.benefitText}>Ver comercios más cercanos</Text>
              </View>
              <View style={styles.benefitRow}>
                <MapPin size={18} color="#9dd9c1" />
                <Text style={styles.benefitText}>Recibir ofertas de tu zona</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
              <Text style={styles.allowButtonText}>Permitir ubicación</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Ahora no</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  webBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  allowButton: {
    width: '100%',
    backgroundColor: '#9dd9c1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#9dd9c1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  allowButtonText: {
    fontSize: 17,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  skipButton: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
});

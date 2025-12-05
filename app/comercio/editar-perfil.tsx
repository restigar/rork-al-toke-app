import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Mail, Fingerprint } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function EditarPerfilComercio() {
  const router = useRouter();
  const { user, updateUser, isBiometricEnabled, isBiometricAvailable, enableBiometric, disableBiometric } = useAuth();
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    Alert.alert('Éxito', 'Contraseña cambiada correctamente');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRecoverPassword = () => {
    if (!user?.email) {
      Alert.alert('Error', 'No hay email asociado');
      return;
    }

    Alert.alert(
      'Recuperar Contraseña',
      `Se enviará un enlace de recuperación a ${user.email}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: () => {
            Alert.alert('Éxito', 'Se ha enviado un enlace de recuperación a tu correo');
          },
        },
      ]
    );
  };

  const handleToggleBiometric = async () => {
    if (isBiometricEnabled) {
      await disableBiometric();
      Alert.alert('Éxito', 'Autenticación biométrica deshabilitada');
    } else {
      const success = await enableBiometric();
      if (success) {
        Alert.alert('Éxito', 'Autenticación biométrica habilitada');
      } else {
        Alert.alert('Error', 'No se pudo habilitar la autenticación biométrica');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>

          <Text style={styles.label}>Contraseña Actual</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showCurrentPassword}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
            >
              {showCurrentPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nueva Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              {showNewPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.changeButton} onPress={handleChangePassword}>
            <Text style={styles.changeButtonText}>Cambiar Contraseña</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recuperar Contraseña</Text>
          <Text style={styles.recoveryText}>
            Si olvidaste tu contraseña, puedes recibir un enlace de recuperación por email
          </Text>
          <TouchableOpacity style={styles.recoveryButton} onPress={handleRecoverPassword}>
            <Mail size={20} color="#1a2332" />
            <Text style={styles.recoveryButtonText}>Enviar enlace de recuperación</Text>
          </TouchableOpacity>
        </View>

        {isBiometricAvailable && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Autenticación Biométrica</Text>
            <Text style={styles.biometricText}>
              Usa tu huella digital o reconocimiento facial para iniciar sesión de forma rápida y segura
            </Text>
            <TouchableOpacity 
              style={[
                styles.biometricButton, 
                isBiometricEnabled && styles.biometricButtonActive
              ]} 
              onPress={handleToggleBiometric}
            >
              <Fingerprint size={20} color={isBiometricEnabled ? "#fff" : "#1a2332"} />
              <Text style={[
                styles.biometricButtonText,
                isBiometricEnabled && styles.biometricButtonTextActive
              ]}>
                {isBiometricEnabled ? 'Deshabilitar' : 'Habilitar'} Autenticación Biométrica
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1a2332',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    color: '#374151',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 14,
  },
  changeButton: {
    backgroundColor: '#1a2332',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  recoveryText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  recoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a2332',
    gap: 8,
  },
  recoveryButtonText: {
    color: '#1a2332',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  biometricText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a2332',
    gap: 8,
    backgroundColor: '#fff',
  },
  biometricButtonActive: {
    backgroundColor: '#1a2332',
    borderColor: '#1a2332',
  },
  biometricButtonText: {
    color: '#1a2332',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  biometricButtonTextActive: {
    color: '#fff',
  },
});

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, EyeOff, Mail, Fingerprint, Trash2, Camera, User, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { moderateImageContent } from '../../lib/content-moderation';
import { subirFotoPerfil } from '../../lib/supabase-uploads';
import { cambiarEmail } from '../../lib/supabase-auth';

export default function EditarPerfilComercio() {
  const router = useRouter();
  const { user, updateUser, deleteAccount, isBiometricEnabled, isBiometricAvailable, enableBiometric, disableBiometric } = useAuth();
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [fotoPerfil, setFotoPerfil] = useState<string>((user as any)?.fotoPerfil || '');
  const [isModeratingImage, setIsModeratingImage] = useState<boolean>(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [nuevoEmail, setNuevoEmail] = useState<string>('');
  const [isChangingEmail, setIsChangingEmail] = useState<boolean>(false);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar imágenes');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      setIsModeratingImage(true);
      const moderation = await moderateImageContent(imageUri);
      setIsModeratingImage(false);

      if (!moderation.isAppropriate) {
        Alert.alert(
          'Contenido no permitido',
          'La imagen seleccionada contiene contenido inapropiado y no puede ser utilizada. Por favor, selecciona una imagen diferente.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      const fotoUrl = await subirFotoPerfil(imageUri, user?.id || '');
      setFotoPerfil(fotoUrl);
      await updateUser({ fotoPerfil: fotoUrl });
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    }
  };

  // Al tocar la foto: opciones de verla (en grande) o cambiarla.
  const handlePhotoPress = () => {
    if (!fotoPerfil) {
      handlePickImage();
      return;
    }
    Alert.alert(
      'Foto de perfil',
      '¿Qué querés hacer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver foto', onPress: () => setShowPhotoViewer(true) },
        { text: 'Cambiar foto', onPress: handlePickImage },
      ]
    );
  };

  const handleChangeEmail = () => {
    const email = nuevoEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert('Error', 'Ingresá tu nuevo email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'El formato del email no es válido');
      return;
    }
    if (email === (user?.email || '').toLowerCase()) {
      Alert.alert('Aviso', 'Ese ya es tu email actual');
      return;
    }

    Alert.alert(
      'Cambiar Email',
      `Vamos a enviar un enlace de confirmación a ${email}. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setIsChangingEmail(true);
            try {
              const { error } = await cambiarEmail(email);
              if (error) {
                Alert.alert('Error', error);
              } else {
                await updateUser({ email });
                setShowEmailModal(false);
                setNuevoEmail('');
                Alert.alert(
                  'Éxito',
                  'Te enviamos un enlace de confirmación a tu nuevo email. Confirmalo para completar el cambio.'
                );
              }
            } finally {
              setIsChangingEmail(false);
            }
          },
        },
      ]
    );
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
          <Text style={styles.sectionTitle}>Foto de Perfil</Text>
          <View style={styles.profilePhotoSection}>
            <TouchableOpacity
              onPress={handlePhotoPress}
              disabled={isModeratingImage}
              activeOpacity={0.8}
            >
              {fotoPerfil ? (
                <Image source={{ uri: fotoPerfil }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <User size={48} color="#9ca3af" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.changePhotoButton, isModeratingImage && styles.buttonDisabled]} 
              onPress={handlePickImage}
              disabled={isModeratingImage}
            >
              {isModeratingImage ? (
                <ActivityIndicator size="small" color="#1a2332" />
              ) : (
                <Camera size={20} color="#1a2332" />
              )}
              <Text style={styles.changePhotoText}>
                {isModeratingImage ? 'Verificando imagen...' : 'Cambiar foto'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
          <Text style={styles.sectionTitle}>Email de la Cuenta</Text>
          <Text style={styles.recoveryText}>
            Este es el email con el que iniciás sesión
          </Text>
          <View style={styles.emailBox}>
            <Mail size={20} color="#1a2332" />
            <Text style={styles.emailBoxText} numberOfLines={1}>
              {user?.email || 'Sin email'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeEmailButton}
            onPress={() => {
              setNuevoEmail(user?.email || '');
              setShowEmailModal(true);
            }}
          >
            <Text style={styles.changeEmailText}>Cambiar email</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zona Peligrosa</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Trash2 size={20} color="#dc2626" />
            <Text style={styles.deleteText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showPhotoViewer} transparent animationType="fade" onRequestClose={() => setShowPhotoViewer(false)}>
          <View style={styles.photoViewerOverlay}>
            <TouchableOpacity style={styles.photoViewerClose} onPress={() => setShowPhotoViewer(false)}>
              <X size={28} color="#fff" />
            </TouchableOpacity>
            {fotoPerfil ? (
              <Image source={{ uri: fotoPerfil }} style={styles.photoViewerImage} resizeMode="contain" />
            ) : null}
          </View>
        </Modal>

        <Modal visible={showEmailModal} transparent animationType="fade" onRequestClose={() => setShowEmailModal(false)}>
          <View style={styles.emailModalOverlay}>
            <View style={styles.emailModalCard}>
              <Text style={styles.emailModalTitle}>Cambiar Email</Text>
              <TextInput
                style={styles.emailModalInput}
                value={nuevoEmail}
                onChangeText={setNuevoEmail}
                placeholder="nuevo@email.com"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.emailModalButtons}>
                <TouchableOpacity
                  style={styles.emailModalCancel}
                  onPress={() => setShowEmailModal(false)}
                  disabled={isChangingEmail}
                >
                  <Text style={styles.emailModalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.emailModalConfirm, isChangingEmail && styles.buttonDisabled]}
                  onPress={handleChangeEmail}
                  disabled={isChangingEmail}
                >
                  {isChangingEmail ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.emailModalConfirmText}>Enviar enlace</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dc2626',
    gap: 8,
  },
  deleteText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  profilePhotoSection: {
    alignItems: 'center',
    gap: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a2332',
    gap: 8,
  },
  changePhotoText: {
    color: '#1a2332',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  emailBoxText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },
  changeEmailButton: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a2332',
  },
  changeEmailText: {
    color: '#1a2332',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoViewerClose: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 8,
    zIndex: 1,
  },
  photoViewerImage: {
    width: '100%',
    height: '80%',
  },
  emailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emailModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  emailModalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 16,
  },
  emailModalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  emailModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emailModalCancel: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  emailModalCancelText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emailModalConfirm: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1a2332',
  },
  emailModalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

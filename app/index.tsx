import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { LogIn, User, Store, X, Eye, EyeOff, Fingerprint, MessageCircle, Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import LocationPermissionModal from '../components/LocationPermissionModal';
import { useBusiness } from '../context/BusinessContext';
import { trpc } from '@/lib/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithGoogle, signInWithApple } from '../lib/firebase-auth';
import { getDocument } from '../lib/firebase-firestore';
import type { Cliente, Comercio } from '../types';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

const ADMIN_TOKEN_KEY = '@altoke_admin_token';

export default function LandingPage() {
  const router = useRouter();
  const auth = useAuth();
  const { login, isBiometricEnabled, isBiometricAvailable, authenticateWithBiometric, showLocationPrompt, requestLocationPermission, skipLocationPermission, enableBiometric, getCredentials } = auth;
  const { comercios } = useBusiness();
  const insets = useSafeAreaInsets();
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { t } = useTranslation();

  const adminLoginMutation = trpc.admin.auth.login.useMutation();

  const offerBiometricSetup = () => {
    Alert.alert(
      t('biometricSetupTitle'),
      t('biometricSetupMessage'),
      [
        {
          text: t('notNow'),
          style: 'cancel',
        },
        {
          text: t('activate'),
          onPress: async () => {
            const success = await enableBiometric();
            if (success) {
              Alert.alert(t('ready'), t('biometricSuccess'));
            }
          },
        },
      ]
    );
  };

  const handleGoogleLogin = async () => {
    try {
      const { user: firebaseUser, error: authError } = await signInWithGoogle();
      
      if (authError || !firebaseUser) {
        Alert.alert(t('error'), authError || 'Error al iniciar sesión con Google');
        return;
      }

      const { data: clienteData } = await getDocument('clientes', firebaseUser.uid);
      if (clienteData) {
        await login(clienteData as Cliente);
        setShowLoginModal(false);
        router.replace('/cliente/perfil');
        return;
      }

      const { data: comercioData } = await getDocument('comercios', firebaseUser.uid);
      if (comercioData) {
        await login(comercioData as Comercio);
        setShowLoginModal(false);
        router.replace('/comercio/dashboard');
        return;
      }

      Alert.alert(t('error'), 'No se encontró una cuenta asociada. Por favor regístrate primero.');
    } catch (error: any) {
      Alert.alert(t('error'), error.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { user: firebaseUser, error: authError } = await signInWithApple();
      
      if (authError || !firebaseUser) {
        Alert.alert(t('error'), authError || 'Error al iniciar sesión con Apple');
        return;
      }

      const { data: clienteData } = await getDocument('clientes', firebaseUser.uid);
      if (clienteData) {
        await login(clienteData as Cliente);
        setShowLoginModal(false);
        router.replace('/cliente/perfil');
        return;
      }

      const { data: comercioData } = await getDocument('comercios', firebaseUser.uid);
      if (comercioData) {
        await login(comercioData as Comercio);
        setShowLoginModal(false);
        router.replace('/comercio/dashboard');
        return;
      }

      Alert.alert(t('error'), 'No se encontró una cuenta asociada. Por favor regístrate primero.');
    } catch (error: any) {
      Alert.alert(t('error'), error.message || 'Error al iniciar sesión con Apple');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('emailPassword'));
      return;
    }

    try {
      const adminResult = await adminLoginMutation.mutateAsync({ email, password });
      
      if (adminResult && adminResult.token) {
        await AsyncStorage.setItem(ADMIN_TOKEN_KEY, adminResult.token);
        setShowLoginModal(false);
        Alert.alert(t('success'), t('welcome_name', { name: adminResult.nombre }));
        router.replace('/admin/dashboard' as Href);
        return;
      }
    } catch {
      console.log('No es administrador, verificando comercio...');
    }

    const comercio = comercios.find(c => c.email === email);
    
    if (comercio) {
      await login(comercio, { email, password, type: 'comercio' });
      setShowLoginModal(false);
      
      if (isBiometricAvailable && !isBiometricEnabled) {
        setTimeout(() => offerBiometricSetup(), 500);
      }
      
      router.replace('/comercio/dashboard');
    } else {
      Alert.alert(t('error'), t('userNotFound'));
    }
  };

  const handleBiometricLogin = async () => {
    const credentials = await getCredentials();
    
    if (!credentials) {
      Alert.alert(t('error'), t('noCredentials'));
      return;
    }

    const success = await authenticateWithBiometric();
    if (success) {
      try {
        if (credentials.type === 'admin') {
          const adminResult = await adminLoginMutation.mutateAsync({
            email: credentials.email,
            password: credentials.password,
          });
          
          if (adminResult && adminResult.token) {
            await AsyncStorage.setItem(ADMIN_TOKEN_KEY, adminResult.token);
            setShowLoginModal(false);
            router.replace('/admin/dashboard' as Href);
            return;
          }
        } else {
          const comercio = comercios.find(c => c.email === credentials.email);
          if (comercio) {
            await login(comercio);
            setShowLoginModal(false);
            router.replace('/comercio/dashboard');
            return;
          }
        }
      } catch {
        Alert.alert(t('error'), t('loginError'));
      }
    }
  };

  return (
    <View style={styles.background}>
      <LocationPermissionModal
        visible={showLocationPrompt}
        onAllow={requestLocationPermission}
        onSkip={skipLocationPermission}
      />
      <View style={styles.container}>
        <View style={[styles.languageSelector, { top: insets.top + 30 }]}>
          <LanguageSelector />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, { top: insets.top + 30 }]}
          onPress={() => setShowLoginModal(true)}
        >
          <LogIn size={20} color="#fff" />
          <Text style={styles.loginButtonText}>{t('login')}</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://i.imgur.com/zpjLZai.png' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>{t('welcome')}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.registerButton, styles.clienteButton]}
              onPress={() => router.push('/registro-cliente')}
            >
              <User size={32} color="#fff" />
              <Text style={styles.registerButtonText}>{t('client')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.registerButton, styles.comercioButton]}
              onPress={() => router.push('/registro-comercio')}
            >
              <Store size={32} color="#fff" />
              <Text style={styles.registerButtonText}>{t('business')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactIconsContainer}>
            <TouchableOpacity
              style={styles.contactIcon}
              onPress={() => {
                const phoneNumber = '5493756441056';
                Linking.openURL(`https://wa.me/${phoneNumber}`);
              }}
            >
              <MessageCircle size={28} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactIcon}
              onPress={() => {
                Linking.openURL('mailto:info@al-toke.com');
              }}
            >
              <Mail size={28} color="#EA4335" />
            </TouchableOpacity>
          </View>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => router.push('/terminos-condiciones')}>
              <Text style={styles.legalLinkText}>{t('terms')}</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={() => router.push('/politica-privacidad')}>
              <Text style={styles.legalLinkText}>{t('privacy')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('loginTitle')}</Text>
              <TouchableOpacity onPress={() => setShowLoginModal(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>{t('email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>{t('password')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
                <Text style={styles.submitButtonText}>{t('enter')}</Text>
              </TouchableOpacity>

              {isBiometricEnabled && isBiometricAvailable && (
                <TouchableOpacity 
                  style={styles.biometricButton} 
                  onPress={handleBiometricLogin}
                >
                  <Fingerprint size={24} color="#1a2332" />
                  <Text style={styles.biometricButtonText}>
                    {t('biometricLogin')}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={handleGoogleLogin}
                >
                  <Image
                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                    style={styles.socialIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={handleAppleLogin}
                >
                  <Image
                    source={{ uri: 'https://www.apple.com/favicon.ico' }}
                    style={styles.socialIcon}
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  languageSelector: {
    position: 'absolute' as const,
    left: 20,
    zIndex: 10,
  },
  loginButton: {
    position: 'absolute' as const,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2332',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    zIndex: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  separator: {
    height: 40,
  },
  logoImage: {
    width: 400,
    height: 160,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 22,
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    maxWidth: 400,
  },
  registerButton: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  clienteButton: {
    backgroundColor: '#9dd9c1',
  },
  comercioButton: {
    backgroundColor: '#1a2332',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 450,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
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
  submitButton: {
    backgroundColor: '#1a2332',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#1a2332',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#f9fafb',
  },
  biometricButtonText: {
    color: '#1a2332',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  contactIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 32,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 20,
    gap: 8,
  },
  legalLinkText: {
    fontSize: 13,
    color: '#6b7280',
    textDecorationLine: 'underline' as const,
  },
  legalSeparator: {
    fontSize: 13,
    color: '#6b7280',
    marginHorizontal: 4,
  },
});

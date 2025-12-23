import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import type { User } from '../types';
import { subscribeToAuthChanges, getCurrentUser } from '../lib/firebase-auth';
import { getDocument } from '../lib/firebase-firestore';

const USER_STORAGE_KEY = '@altoke_user';
const BIOMETRIC_ENABLED_KEY = '@altoke_biometric_enabled';
const LOCATION_ASKED_KEY = '@altoke_location_asked';
const CREDENTIALS_EMAIL_KEY = 'altoke_credentials_email';
const CREDENTIALS_PASSWORD_KEY = 'altoke_credentials_password';
const CREDENTIALS_TYPE_KEY = 'altoke_credentials_type';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(false);

  const loadUser = useCallback(async () => {
    try {
      console.log('🔍 [AuthContext] Iniciando carga de usuario...');
      
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        console.log('✅ [AuthContext] Usuario encontrado en AsyncStorage');
        setUser(JSON.parse(userJson));
      } else {
        console.log('ℹ️ [AuthContext] No hay usuario guardado en AsyncStorage');
      }
      
      try {
        const firebaseUser = getCurrentUser();
        if (firebaseUser) {
          console.log('✅ [AuthContext] Sesión activa en Firebase:', firebaseUser.uid);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          
          try {
            const clientePromise = getDocument('clientes', firebaseUser.uid);
            const { data: clienteData } = await Promise.race([clientePromise, timeoutPromise]) as any;
            
            if (clienteData) {
              console.log('✅ [AuthContext] Datos de cliente sincronizados desde Firestore');
              await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(clienteData));
              setUser(clienteData as User);
            } else {
              const comercioPromise = getDocument('comercios', firebaseUser.uid);
              const { data: comercioData } = await Promise.race([comercioPromise, timeoutPromise]) as any;
              
              if (comercioData) {
                console.log('✅ [AuthContext] Datos de comercio sincronizados desde Firestore');
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(comercioData));
                setUser(comercioData as User);
              }
            }
          } catch {
            console.log('⚠️ [AuthContext] Timeout al sincronizar con Firestore, usando datos locales');
          }
        } else {
          console.log('ℹ️ [AuthContext] No hay sesión activa en Firebase');
        }
      } catch (firebaseError) {
        console.log('⚠️ [AuthContext] Error con Firebase, continuando con datos locales:', firebaseError);
      }
      
      const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(biometricEnabled === 'true');
      
      console.log('✅ [AuthContext] Carga de usuario completada');
    } catch (error) {
      console.error('❌ [AuthContext] Error crítico loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    console.log('🔄 [AuthContext] Configurando listener de Firebase...');
    try {
      const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser && !user) {
        console.log('🔔 Cambio de autenticación detectado:', firebaseUser.uid);
        
        const { data: clienteData } = await getDocument('clientes', firebaseUser.uid);
        if (clienteData) {
          console.log('✅ Auto-login con datos de cliente');
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(clienteData));
          setUser(clienteData as User);
          return;
        }
        
        const { data: comercioData } = await getDocument('comercios', firebaseUser.uid);
        if (comercioData) {
          console.log('✅ Auto-login con datos de comercio');
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(comercioData));
          setUser(comercioData as User);
          return;
        }
      } else if (!firebaseUser && user) {
        console.log('🔔 Sesión cerrada en Firebase');
      }
    });

      return () => {
        console.log('🔄 [AuthContext] Desuscribiendo listener de Firebase');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ [AuthContext] Error configurando listener Firebase:', error);
    }
  }, [user]);

  const checkBiometricAvailability = async () => {
    if (Platform.OS === 'web') {
      setIsBiometricAvailable(false);
      return;
    }
    
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsBiometricAvailable(false);
    }
  };

  const login = useCallback(async (userData: User, credentials?: { email: string; password: string; type?: string }) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      
      if (credentials && Platform.OS !== 'web') {
        await saveCredentials(credentials.email, credentials.password, credentials.type || userData.type || 'cliente');
      }
      
      const hasAskedLocation = await AsyncStorage.getItem(LOCATION_ASKED_KEY);
      
      if (!hasAskedLocation && Platform.OS !== 'web') {
        setShowLocationPrompt(true);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await AsyncStorage.setItem(LOCATION_ASKED_KEY, 'true');
      setShowLocationPrompt(false);
      
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
      } else {
        console.log('Permiso de ubicación concedido');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  }, []);

  const skipLocationPermission = useCallback(async () => {
    await AsyncStorage.setItem(LOCATION_ASKED_KEY, 'true');
    setShowLocationPrompt(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, [user]);

  const deleteAccount = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(LOCATION_ASKED_KEY);
      await deleteCredentials();
      setUser(null);
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }, []);

  const saveCredentials = async (email: string, password: string, type: string) => {
    if (Platform.OS === 'web') return;
    
    try {
      await SecureStore.setItemAsync(CREDENTIALS_EMAIL_KEY, email);
      await SecureStore.setItemAsync(CREDENTIALS_PASSWORD_KEY, password);
      await SecureStore.setItemAsync(CREDENTIALS_TYPE_KEY, type);
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const getCredentials = useCallback(async (): Promise<{ email: string; password: string; type: string } | null> => {
    if (Platform.OS === 'web') return null;
    
    try {
      const email = await SecureStore.getItemAsync(CREDENTIALS_EMAIL_KEY);
      const password = await SecureStore.getItemAsync(CREDENTIALS_PASSWORD_KEY);
      const type = await SecureStore.getItemAsync(CREDENTIALS_TYPE_KEY);
      
      if (email && password && type) {
        return { email, password, type };
      }
      return null;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return null;
    }
  }, []);

  const deleteCredentials = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      await SecureStore.deleteItemAsync(CREDENTIALS_EMAIL_KEY);
      await SecureStore.deleteItemAsync(CREDENTIALS_PASSWORD_KEY);
      await SecureStore.deleteItemAsync(CREDENTIALS_TYPE_KEY);
    } catch (error) {
      console.error('Error deleting credentials:', error);
    }
  };

  const enableBiometric = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No Disponible', 'La autenticación biométrica no está disponible en la web');
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirma tu identidad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        setIsBiometricEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }, []);

  const disableBiometric = useCallback(async () => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      await deleteCredentials();
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Error disabling biometric:', error);
    }
  }, []);

  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Inicia sesión con tu huella o rostro',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Error authenticating with biometric:', error);
      return false;
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    updateUser,
    deleteAccount,
    isCliente: user?.type === 'cliente',
    isComercio: user?.type === 'comercio',
    isBiometricEnabled,
    isBiometricAvailable,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
    showLocationPrompt,
    requestLocationPermission,
    skipLocationPermission,
    getCredentials,
  }), [user, isLoading, login, logout, updateUser, deleteAccount, isBiometricEnabled, isBiometricAvailable, enableBiometric, disableBiometric, authenticateWithBiometric, showLocationPrompt, requestLocationPermission, skipLocationPermission, getCredentials]);
});

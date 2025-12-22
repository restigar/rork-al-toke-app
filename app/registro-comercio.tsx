import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import type { Comercio } from '../types';
import { signUp, signInWithGoogle, signInWithApple } from '../lib/firebase-auth';
import { createDocument, getDocument } from '../lib/firebase-firestore';

export default function RegistroComercio() {
  const router = useRouter();
  const { login, isBiometricAvailable, isBiometricEnabled, enableBiometric } = useAuth();
  const { saveComercio, getNextComercioNumber } = useBusiness();
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const offerBiometricSetup = () => {
    Alert.alert(
      'Iniciar sesión con huella',
      '¿Quieres activar el inicio de sesión con huella dactilar o reconocimiento facial para acceder más rápido la próxima vez?',
      [
        {
          text: 'Ahora no',
          style: 'cancel',
          onPress: () => router.replace('/comercio/dashboard'),
        },
        {
          text: 'Activar',
          onPress: async () => {
            const success = await enableBiometric();
            if (success) {
              Alert.alert('¡Listo!', 'Ahora puedes iniciar sesión con tu huella o rostro', [
                { text: 'OK', onPress: () => router.replace('/comercio/dashboard') },
              ]);
            } else {
              router.replace('/comercio/dashboard');
            }
          },
        },
      ]
    );
  };

  const handleGoogleSignIn = async () => {
    setIsRegistering(true);
    try {
      const { user: firebaseUser, error: authError } = await signInWithGoogle();
      
      if (authError || !firebaseUser) {
        Alert.alert('Error', authError || 'Error al iniciar sesión con Google');
        setIsRegistering(false);
        return;
      }

      const { data: existingComercio } = await getDocument('comercios', firebaseUser.uid);
      
      if (existingComercio) {
        try {
          await saveComercio(existingComercio as Comercio);
          await login(existingComercio as Comercio);
          setIsRegistering(false);
          router.replace('/comercio/dashboard');
        } catch {
          setIsRegistering(false);
          Alert.alert('Error', 'Error al iniciar sesión');
        }
        return;
      }

      const comercioNumber = await getNextComercioNumber();
      const numeroComercio = `${comercioNumber}`;
      
      const newComercio: Comercio = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Comercio',
        nombre: firebaseUser.displayName || 'Comercio',
        email: firebaseUser.email || '',
        type: 'comercio',
        numeroComercio,
        fotoPerfil: firebaseUser.photoURL || undefined,
      };

      const { success: createSuccess, error: createError } = await createDocument('comercios', firebaseUser.uid, newComercio);
      
      if (!createSuccess || createError) {
        setIsRegistering(false);
        Alert.alert('Error', 'Error al guardar datos del comercio');
        return;
      }

      console.log('📝 Creando documento en stores para panel admin...');
      const { success: storesSuccess, error: storesError } = await createDocument('stores', firebaseUser.uid, {
        name: firebaseUser.displayName || 'Comercio',
        email: firebaseUser.email || '',
        phone: newComercio.telefono || 'N/A',
        status: 'Activo',
      });
      
      if (!storesSuccess || storesError) {
        console.error('❌ Error al crear documento en stores:', storesError);
      } else {
        console.log('✅ Documento creado exitosamente en stores');
      }
      
      try {
        await saveComercio(newComercio);
        await login(newComercio);
        setIsRegistering(false);
        Alert.alert('Éxito', '¡Registro completado con Google!', [
          { text: 'OK', onPress: () => router.replace('/comercio/dashboard') },
        ]);
      } catch {
        setIsRegistering(false);
        Alert.alert('Error', 'Error al iniciar sesión');
      }
    } catch (error: any) {
      setIsRegistering(false);
      Alert.alert('Error', error.message || 'Error al registrar con Google');
    }
  };

  const handleAppleSignIn = async () => {
    setIsRegistering(true);
    try {
      const { user: firebaseUser, error: authError } = await signInWithApple();
      
      if (authError || !firebaseUser) {
        Alert.alert('Error', authError || 'Error al iniciar sesión con Apple');
        setIsRegistering(false);
        return;
      }

      const { data: existingComercio } = await getDocument('comercios', firebaseUser.uid);
      
      if (existingComercio) {
        try {
          await saveComercio(existingComercio as Comercio);
          await login(existingComercio as Comercio);
          setIsRegistering(false);
          router.replace('/comercio/dashboard');
        } catch {
          setIsRegistering(false);
          Alert.alert('Error', 'Error al iniciar sesión');
        }
        return;
      }

      const comercioNumber = await getNextComercioNumber();
      const numeroComercio = `${comercioNumber}`;
      
      const newComercio: Comercio = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Comercio',
        nombre: firebaseUser.displayName || 'Comercio',
        email: firebaseUser.email || '',
        type: 'comercio',
        numeroComercio,
        fotoPerfil: firebaseUser.photoURL || undefined,
      };

      const { success: createSuccess, error: createError } = await createDocument('comercios', firebaseUser.uid, newComercio);
      
      if (!createSuccess || createError) {
        setIsRegistering(false);
        Alert.alert('Error', 'Error al guardar datos del comercio');
        return;
      }

      console.log('📝 Creando documento en stores para panel admin...');
      const { success: storesSuccess, error: storesError } = await createDocument('stores', firebaseUser.uid, {
        name: firebaseUser.displayName || 'Comercio',
        email: firebaseUser.email || '',
        phone: newComercio.telefono || 'N/A',
        status: 'Activo',
      });
      
      if (!storesSuccess || storesError) {
        console.error('❌ Error al crear documento en stores:', storesError);
      } else {
        console.log('✅ Documento creado exitosamente en stores');
      }
      
      try {
        await saveComercio(newComercio);
        await login(newComercio);
        setIsRegistering(false);
        Alert.alert('Éxito', '¡Registro completado con Apple!', [
          { text: 'OK', onPress: () => router.replace('/comercio/dashboard') },
        ]);
      } catch {
        setIsRegistering(false);
        Alert.alert('Error', 'Error al iniciar sesión');
      }
    } catch (error: any) {
      setIsRegistering(false);
      Alert.alert('Error', error.message || 'Error al registrar con Apple');
    }
  };

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsRegistering(true);

    try {
      const { user: firebaseUser, error: authError } = await signUp(email, password, nombre);
      
      if (authError || !firebaseUser) {
        Alert.alert('Error', authError || 'Error al crear la cuenta');
        setIsRegistering(false);
        return;
      }

      const comercioNumber = await getNextComercioNumber();
      const numeroComercio = `${comercioNumber}`;
      
      const newComercio: Comercio = {
        id: firebaseUser.uid,
        name: nombre,
        nombre,
        email,
        type: 'comercio',
        numeroComercio,
        telefono,
      };

      const { success: firestoreSuccess, error: firestoreError } = await createDocument('comercios', firebaseUser.uid, newComercio);
      
      if (!firestoreSuccess || firestoreError) {
        console.error('Error guardando datos del comercio:', firestoreError);
        Alert.alert('Error', 'Error al guardar los datos del comercio. Por favor, intenta de nuevo.');
        setIsRegistering(false);
        return;
      }

      console.log('✅ Documento creado en comercios. Creando documento en stores para panel admin...');
      const { success: storesSuccess, error: storesError } = await createDocument('stores', firebaseUser.uid, {
        name: nombre,
        email,
        phone: telefono || 'N/A',
        status: 'Activo',
      });
      
      if (!storesSuccess || storesError) {
        console.error('❌ Error al crear documento en stores:', storesError);
      } else {
        console.log('✅ Documento creado exitosamente en stores para panel admin');
      }
      
      console.log('✅ Proceso de registro completado. Iniciando login...');
      
      try {
        await saveComercio(newComercio);
        await login(newComercio, { email, password, type: 'comercio' });
        console.log('✅ Login completado exitosamente');
        
        if (isBiometricAvailable && !isBiometricEnabled) {
          setIsRegistering(false);
          offerBiometricSetup();
        } else {
          setIsRegistering(false);
          Alert.alert('¡Éxito!', '¡Registro completado! Bienvenido a Al-Toke', [
            { text: 'OK', onPress: () => router.replace('/comercio/dashboard') },
          ]);
        }
      } catch (loginError: any) {
        console.error('❌ Error en login:', loginError);
        setIsRegistering(false);
        Alert.alert('Error', 'Registro exitoso pero hubo un problema al iniciar sesión. Por favor, inicia sesión manualmente.');
      }
    } catch (error: any) {
      setIsRegistering(false);
      Alert.alert('Error', error.message || 'Error al registrar el comercio');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Registro de Comercio</Text>
        <Text style={styles.subtitle}>Crea tu cuenta para promocionar tu negocio</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre del Comercio *</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Mi Negocio"
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="negocio@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <Eye size={24} color="#6b7280" />
              ) : (
                <EyeOff size={24} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirmar Contraseña *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <Eye size={24} color="#6b7280" />
              ) : (
                <EyeOff size={24} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            placeholder="+54 11 1234-5678"
            keyboardType="phone-pad"
          />

          <TouchableOpacity 
            style={[styles.button, isRegistering && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={isRegistering}
          >
            {isRegistering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrarse</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O regístrate con</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={isRegistering}
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleAppleSignIn}
              disabled={isRegistering}
            >
              <Image
                source={{ uri: 'https://www.apple.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>* Campos obligatorios</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 20,
    backgroundColor: '#f9fafb',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  button: {
    backgroundColor: '#1a2332',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  note: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 16,
    textAlign: 'center',
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
    marginBottom: 12,
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
});

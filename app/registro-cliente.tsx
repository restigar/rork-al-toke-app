import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import type { Cliente } from '../types';
import { signUp } from '../lib/firebase-auth';
import { createDocument } from '../lib/firebase-firestore';

export default function RegistroCliente() {
  const router = useRouter();
  const { login, isBiometricAvailable, isBiometricEnabled, enableBiometric } = useAuth();
  const { getNextClienteNumber } = useBusiness();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
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
          onPress: () => router.replace('/cliente/perfil'),
        },
        {
          text: 'Activar',
          onPress: async () => {
            const success = await enableBiometric();
            if (success) {
              Alert.alert('¡Listo!', 'Ahora puedes iniciar sesión con tu huella o rostro', [
                { text: 'OK', onPress: () => router.replace('/cliente/perfil') },
              ]);
            } else {
              router.replace('/cliente/perfil');
            }
          },
        },
      ]
    );
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor complete todos los campos');
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
      const name = `${firstName} ${lastName}`;
      
      const { user: firebaseUser, error: authError } = await signUp(email, password, name);
      
      if (authError || !firebaseUser) {
        Alert.alert('Error', authError || 'Error al crear la cuenta');
        setIsRegistering(false);
        return;
      }

      const clienteNumber = await getNextClienteNumber();
      const numeroCliente = `${clienteNumber}`;
      
      const newCliente: Cliente = {
        id: firebaseUser.uid,
        name,
        email,
        type: 'cliente',
        numeroCliente,
      };

      const { error: firestoreError } = await createDocument('clientes', firebaseUser.uid, newCliente);
      
      if (firestoreError) {
        console.error('Error guardando datos del cliente:', firestoreError);
      }

      await login(newCliente, { email, password, type: 'cliente' });
      
      setIsRegistering(false);
      
      if (isBiometricAvailable && !isBiometricEnabled) {
        setTimeout(() => offerBiometricSetup(), 500);
      } else {
        Alert.alert('Éxito', '¡Registro completado!', [
          { text: 'OK', onPress: () => router.replace('/cliente/perfil') },
        ]);
      }
    } catch (error: any) {
      setIsRegistering(false);
      Alert.alert('Error', error.message || 'Error al registrar el usuario');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Registro de Cliente</Text>
        <Text style={styles.subtitle}>Crea tu cuenta para descubrir ofertas cerca de ti</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Juan"
          />

          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Pérez"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
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

          <Text style={styles.label}>Confirmar Contraseña</Text>
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
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={{ uri: 'https://www.apple.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Image
                source={{ uri: 'https://www.facebook.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#9dd9c1',
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
});

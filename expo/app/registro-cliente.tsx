import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { Eye, EyeOff, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import type { Cliente } from '../types';
import { signUp, signInWithGoogle, signInWithApple } from '../lib/supabase-auth';
import { getPerfil, completarPerfilCliente } from '../lib/supabase-db';

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
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [registroExitoso, setRegistroExitoso] = useState<boolean>(false);
  const [mensajeError, setMensajeError] = useState<string>('');

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

  // Evita que la pantalla quede tildada si alguna llamada a Supabase no responde.
  const conTimeout = <T,>(promesa: Promise<T>, ms = 30000): Promise<T> =>
    Promise.race([
      promesa,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('timeout-registro')), ms)
      ),
    ]);

  const continuarTrasRegistro = () => {
    if (Platform.OS !== 'web' && isBiometricAvailable && !isBiometricEnabled) {
      offerBiometricSetup();
    } else {
      router.replace('/cliente/perfil');
    }
  };

  const registrarConOAuth = async (proveedor: 'google' | 'apple') => {
    setIsRegistering(true);
    try {
      const resultado = proveedor === 'google' ? await signInWithGoogle() : await signInWithApple();
      const { user: usuarioAuth, error: authError } = resultado;

      if (authError) {
        setMensajeError(authError);
        setIsRegistering(false);
        return;
      }
      if (!usuarioAuth) {
        // OAuth web: redirigiendo al proveedor; la sesión se retoma al volver.
        setIsRegistering(false);
        return;
      }

      const { data: existingCliente } = await getPerfil(usuarioAuth.uid);

      if (existingCliente) {
        try {
          await login(existingCliente as Cliente);
          setIsRegistering(false);
          router.replace('/cliente/perfil');
        } catch {
          setIsRegistering(false);
          setMensajeError('Error al iniciar sesión');
        }
        return;
      }

      // El trigger de Supabase ya creó la fila en `clientes`; completamos
      // los datos que vienen del proveedor OAuth.
      await completarPerfilCliente(
        usuarioAuth.uid,
        usuarioAuth.displayName || 'Usuario',
        usuarioAuth.photoURL ?? undefined
      );

      const { data: perfilActualizado } = await getPerfil(usuarioAuth.uid);
      const numeroCliente =
        perfilActualizado && perfilActualizado.type === 'cliente'
          ? perfilActualizado.numeroCliente || `${await getNextClienteNumber()}`
          : `${await getNextClienteNumber()}`;

      const newCliente: Cliente = {
        id: usuarioAuth.uid,
        name: usuarioAuth.displayName || 'Usuario',
        email: usuarioAuth.email || '',
        type: 'cliente',
        numeroCliente,
        fotoPerfil: usuarioAuth.photoURL ?? undefined,
      };

      try {
        await conTimeout(login(newCliente));
        setIsRegistering(false);
        setRegistroExitoso(true);
      } catch {
        setIsRegistering(false);
        setMensajeError('Error al iniciar sesión');
      }
    } catch (error: any) {
      setIsRegistering(false);
      setMensajeError(error.message || `Error al registrar con ${proveedor === 'google' ? 'Google' : 'Apple'}`);
    }
  };

  const handleGoogleSignIn = async () => registrarConOAuth('google');

  const handleAppleSignIn = async () => registrarConOAuth('apple');

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setMensajeError('Por favor complete todos los campos');
      return;
    }

    if (!acceptedTerms) {
      setMensajeError('Debes aceptar los términos y condiciones para continuar');
      return;
    }

    if (password !== confirmPassword) {
      setMensajeError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsRegistering(true);
    setMensajeError('');

    try {
      console.log('📝 Iniciando registro de cliente...');
      const name = `${firstName} ${lastName}`;
      
      // El metadata viaja a Supabase y el trigger `crear_perfil_usuario`
      // crea la fila en la tabla `clientes` con número CL00001 automático.
      const { user: usuarioAuth, error: authError } = await conTimeout(
        signUp(email, password, name, {
          type: 'cliente',
          nombre: firstName,
          apellido: lastName,
          aceptoTerminos: acceptedTerms,
        })
      );
      
      if (authError || !usuarioAuth) {
        setMensajeError(authError || 'Error al crear la cuenta');
        setIsRegistering(false);
        return;
      }

      // El perfil ya existe en Supabase con su número de cliente;
      // si no se pudo leer (ej: falta confirmar email), usamos el local.
      const { data: perfilCreado } = await conTimeout(getPerfil(usuarioAuth.uid));
      const numeroCliente =
        perfilCreado && perfilCreado.type === 'cliente' && perfilCreado.numeroCliente
          ? perfilCreado.numeroCliente
          : `${await getNextClienteNumber()}`;
      
      const newCliente: Cliente = {
        id: usuarioAuth.uid,
        name,
        email,
        type: 'cliente',
        numeroCliente,
        ...(perfilCreado?.fotoPerfil ? { fotoPerfil: perfilCreado.fotoPerfil } : {}),
      };

      console.log('✅ Registro completado en Supabase. Iniciando login...');
      
      try {
        await conTimeout(login(newCliente, { email, password, type: 'cliente' }));
        console.log('✅ Login completado exitosamente');
        setIsRegistering(false);
        setRegistroExitoso(true);
      } catch (loginError: any) {
        console.error('❌ Error en login:', loginError);
        setIsRegistering(false);
        setMensajeError('Registro exitoso pero hubo un problema al iniciar sesión. Por favor, inicia sesión manualmente.');
      }
    } catch (error: any) {
      setIsRegistering(false);
      setMensajeError(
        error.message === 'timeout-registro'
          ? 'El registro está tardando demasiado. Verificá tu conexión e intentá nuevamente.'
          : error.message || 'Error al registrar el usuario'
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {registroExitoso ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Check size={40} color="#fff" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>¡Registro exitoso!</Text>
            <Text style={styles.successText}>
              Tu cuenta fue creada correctamente. ¡Bienvenido a Al-Toke!
            </Text>
            <TouchableOpacity style={styles.button} onPress={continuarTrasRegistro}>
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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

          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              {acceptedTerms && (
                <Check size={18} color="#9dd9c1" strokeWidth={3} />
              )}
            </TouchableOpacity>
            <Text style={styles.termsText}>
              He leído y acepto los{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => router.push('/terminos-condiciones')}
              >
                Términos y Condiciones
              </Text>
              {' '}y la{' '}
              <Text 
                style={styles.termsLink}
                onPress={() => router.push('/politica-privacidad')}
              >
                Política de Privacidad
              </Text>
            </Text>
          </View>

          {mensajeError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{mensajeError}</Text>
            </View>
          ) : null}

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
            </View>
          </>
        )}
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#9dd9c1',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  termsLink: {
    color: '#9dd9c1',
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#9dd9c1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});

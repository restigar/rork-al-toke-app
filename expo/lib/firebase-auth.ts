import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
} from 'firebase/auth';
import { auth } from './firebase';
import { Platform } from 'react-native';

/**
 * Traduce los errores técnicos de Firebase Auth a mensajes claros en español.
 */
export const mensajeAmigable = (error: any): string => {
  const codigo: string = error?.code || '';

  const mensajes: Record<string, string> = {
    'auth/email-already-in-use': 'Ese email ya está registrado. Iniciá sesión con esa cuenta o usá otro email.',
    'auth/invalid-email': 'El formato del email no es válido.',
    'auth/weak-password': 'La contraseña es muy débil. Usá al menos 6 caracteres.',
    'auth/user-not-found': 'No existe una cuenta con ese email.',
    'auth/wrong-password': 'Email o contraseña incorrectos.',
    'auth/invalid-credential': 'Email o contraseña incorrectos.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
    'auth/network-request-failed': 'Sin conexión a internet. Verificá tu conexión e intentá de nuevo.',
    'auth/operation-not-allowed': 'Este método de acceso no está habilitado. Contactá a soporte.',
    'auth/user-disabled': 'Esta cuenta fue deshabilitada. Contactá a soporte.',
  };

  if (codigo && mensajes[codigo]) {
    return mensajes[codigo];
  }

  const texto: string = error?.message || '';
  if (texto.includes('email-already-in-use')) {
    return mensajes['auth/email-already-in-use']!;
  }
  if (texto.includes('network')) {
    return mensajes['auth/network-request-failed']!;
  }

  return texto || 'Ocurrió un error inesperado. Intentá de nuevo.';
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Usuario autenticado:', userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión:', error.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

export const signUp = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    console.log('✅ Usuario registrado:', userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('❌ Error al registrar usuario:', error.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('✅ Sesión cerrada');
    return { error: null };
  } catch (error: any) {
    console.error('❌ Error al cerrar sesión:', error.message);
    return { error: error.message };
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Email de recuperación enviado');
    return { error: null };
  } catch (error: any) {
    console.error('❌ Error al enviar email de recuperación:', error.message);
    return { error: mensajeAmigable(error) };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    if (Platform.OS === 'web') {
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Usuario autenticado con Google:', result.user.uid);
      return { user: result.user, error: null };
    } else {
      console.log('ℹ️ Google Sign-In en móvil requiere configuración adicional');
      return { user: null, error: 'Google Sign-In solo disponible en web por ahora' };
    }
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión con Google:', error.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

export const signInWithApple = async () => {
  try {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    
    if (Platform.OS === 'web') {
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Usuario autenticado con Apple:', result.user.uid);
      return { user: result.user, error: null };
    } else {
      console.log('ℹ️ Apple Sign-In en móvil requiere configuración adicional');
      return { user: null, error: 'Apple Sign-In solo disponible en web por ahora' };
    }
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión con Apple:', error.message);
    return { user: null, error: mensajeAmigable(error) };
  }
};

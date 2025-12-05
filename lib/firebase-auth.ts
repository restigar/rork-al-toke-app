import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Usuario autenticado:', userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión:', error.message);
    return { user: null, error: error.message };
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
    return { user: null, error: error.message };
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
    return { error: error.message };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

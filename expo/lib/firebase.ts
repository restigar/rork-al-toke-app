import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyClMWxxt3ssnScAYDaq6Dge0VrMIEzSyG0",
  authDomain: "studio-8462520778-609ca.firebaseapp.com",
  databaseURL: "https://studio-8462520778-609ca-default-rtdb.firebaseio.com",
  projectId: "studio-8462520778-609ca",
  storageBucket: "studio-8462520778-609ca.firebasestorage.app",
  messagingSenderId: "770675581016",
  appId: "1:770675581016:web:2625d9bd7f471fc2a82a2d"
};

/**
 * Garantiza que exista una app de Firebase inicializada.
 * Es idempotente y auto-reparable: si por algún motivo el módulo se
 * re-evalúa (Fast Refresh, lazy bundling de Metro) o la instancia no
 * existe en ese contexto, la vuelve a crear en lugar de fallar con
 * "The default Firebase app does not exist".
 */
export function asegurarFirebase(): FirebaseApp {
  if (!getApps().length) {
    console.log('🔥 [Firebase] Inicializando Firebase App...');
    const nuevaApp = initializeApp(firebaseConfig);
    console.log('✅ [Firebase] App inicializado');
    return nuevaApp;
  }
  return getApp();
}

let dbCache: Firestore | null = null;
let authCache: Auth | null = null;
let storageCache: FirebaseStorage | null = null;

/**
 * Devuelve Firestore listo para usar.
 * Usa auto-detección de long-polling: evita que Firestore quede
 * "offline" en redes móviles que bloquean WebChannels/WebSockets.
 */
export function obtenerDb(): Firestore {
  if (!dbCache) {
    dbCache = initializeFirestore(asegurarFirebase(), {
      experimentalAutoDetectLongPolling: true,
    });
    console.log('✅ [Firebase] Firestore inicializado (long-polling automático)');
  }
  return dbCache;
}

/** Devuelve Auth listo para usar. */
export function obtenerAuth(): Auth {
  if (!authCache) {
    authCache = getAuth(asegurarFirebase());
    console.log('✅ [Firebase] Auth inicializado');
  }
  return authCache;
}

/** Devuelve Storage listo para usar. */
export function obtenerStorage(): FirebaseStorage {
  if (!storageCache) {
    storageCache = getStorage(asegurarFirebase());
    console.log('✅ [Firebase] Storage inicializado');
  }
  return storageCache;
}

// Instancias module-level (compatibilidad con imports existentes)
export const auth = obtenerAuth();
export const db = obtenerDb();
export const storage = obtenerStorage();

export default asegurarFirebase();

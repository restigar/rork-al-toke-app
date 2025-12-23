import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore, enableNetwork, disableNetwork, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyClMWxxt3ssnScAYDaq6Dge0VrMIEzSyG0",
  authDomain: "studio-8462520778-609ca.firebaseapp.com",
  databaseURL: "https://studio-8462520778-609ca-default-rtdb.firebaseio.com",
  projectId: "studio-8462520778-609ca",
  storageBucket: "studio-8462520778-609ca.firebasestorage.app",
  messagingSenderId: "770675581016",
  appId: "1:770675581016:web:2625d9bd7f471fc2a82a2d"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

if (!getApps().length) {
  console.log('🔥 [Firebase] Inicializando Firebase App...');
  app = initializeApp(firebaseConfig);
  console.log('✅ [Firebase] App inicializado');
  
  if (Platform.OS === 'web') {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalForceLongPolling: true,
    });
  } else {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: false,
    });
  }
  
  console.log('✅ [Firebase] Firestore inicializado');
  
  if (Platform.OS !== 'web') {
    disableNetwork(db)
      .then(() => {
        console.log('🔄 [Firebase] Cache deshabilitada temporalmente');
        return enableNetwork(db);
      })
      .then(() => console.log('✅ [Firebase] Network habilitada - Modo online forzado'))
      .catch((err) => console.log('⚠️ [Firebase] Network warning:', err.message));
  } else {
    enableNetwork(db)
      .then(() => console.log('✅ [Firebase] Network habilitada'))
      .catch((err) => console.log('⚠️ [Firebase] Network warning:', err.message));
  }
  
  auth = getAuth(app);
  storage = getStorage(app);
  console.log('✅ [Firebase] Todos los servicios listos (Auth, Firestore, Storage)');
} else {
  app = getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  console.log('✅ [Firebase] Usando instancia existente');
}

export { auth, db, storage };
export default app;

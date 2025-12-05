import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyClMWxxt3ssnScAYDaq6Dge0VrMIEzSyG0",
  authDomain: "studio-8462520778-609ca.firebaseapp.com",
  databaseURL: "https://studio-8462520778-609ca-default-rtdb.firebaseio.com",
  projectId: "studio-8462520778-609ca",
  storageBucket: "studio-8462520778-609ca.firebasestorage.app",
  messagingSenderId: "770675581016",
  appId: "1:770675581016:web:2625d9bd7f471fc2a82a2d"
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;

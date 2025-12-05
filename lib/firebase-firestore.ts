import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

export const createDocument = async <T extends DocumentData>(
  collectionName: string, 
  docId: string, 
  data: T
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ Documento creado en ${collectionName}:`, docId);
    return { success: true, error: null };
  } catch (error: any) {
    console.error(`❌ Error al crear documento en ${collectionName}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const getDocument = async <T = DocumentData>(
  collectionName: string, 
  docId: string
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() } as T, error: null };
    } else {
      return { data: null, error: 'Documento no encontrado' };
    }
  } catch (error: any) {
    console.error(`❌ Error al obtener documento de ${collectionName}:`, error.message);
    return { data: null, error: error.message };
  }
};

export const getDocuments = async <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<{ data: T[]; error: string | null }> => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    
    return { data, error: null };
  } catch (error: any) {
    console.error(`❌ Error al obtener documentos de ${collectionName}:`, error.message);
    return { data: [], error: error.message };
  }
};

export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string,
  docId: string,
  data: T
) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    console.log(`✅ Documento actualizado en ${collectionName}:`, docId);
    return { success: true, error: null };
  } catch (error: any) {
    console.error(`❌ Error al actualizar documento en ${collectionName}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`✅ Documento eliminado de ${collectionName}:`, docId);
    return { success: true, error: null };
  } catch (error: any) {
    console.error(`❌ Error al eliminar documento de ${collectionName}:`, error.message);
    return { success: false, error: error.message };
  }
};

export { where, orderBy, limit, Timestamp };

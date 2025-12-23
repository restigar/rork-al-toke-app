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
  console.log('🔥🔥🔥 ===== INICIANDO ESCRITURA EN FIRESTORE ===== 🔥🔥🔥');
  console.log(`📝 Colección: ${collectionName}`);
  console.log(`📝 ID del documento: ${docId}`);
  console.log(`📝 Datos a guardar:`, JSON.stringify(data, null, 2));
  
  try {
    const docRef = doc(db, collectionName, docId);
    console.log('✅ Referencia al documento creada');
    
    const dataToSave = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    console.log('📦 Datos preparados para guardar:', JSON.stringify(dataToSave, null, 2));
    
    console.log('⏳ Ejecutando setDoc...');
    await setDoc(docRef, dataToSave);
    console.log('✅✅✅ setDoc COMPLETADO EXITOSAMENTE ✅✅✅');
    
    console.log(`🎉🎉🎉 ÉXITO: Documento creado en Firestore en la colección /${collectionName} con ID: ${docId}`);
    console.log('🔥🔥🔥 ===== ESCRITURA EXITOSA ===== 🔥🔥🔥');
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('🚨🚨🚨 ===== ERROR CRÍTICO EN FIRESTORE ===== 🚨🚨🚨');
    console.error(`❌ Error al crear documento en ${collectionName}`);
    console.error(`❌ ID del documento: ${docId}`);
    console.error(`❌ Error completo:`, error);
    console.error(`❌ Error code:`, error.code);
    console.error(`❌ Error message:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
    console.error('🚨🚨🚨 ===== FIN DEL ERROR ===== 🚨🚨🚨');
    
    let friendlyMessage = error.message;
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      friendlyMessage = 'Sin conexión a internet. Por favor verifica tu conexión.';
    } else if (error.code === 'permission-denied') {
      friendlyMessage = 'No tienes permisos para realizar esta acción.';
    }
    
    return { success: false, error: `${friendlyMessage} (Código: ${error.code || 'DESCONOCIDO'})` };
  }
};

export const getDocument = async <T = DocumentData>(
  collectionName: string, 
  docId: string
): Promise<{ data: T | null; error: string | null }> => {
  try {
    console.log(`🔍 Intentando obtener documento de ${collectionName}:`, docId);
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log(`✅ Documento obtenido de ${collectionName}:`, docId);
      return { data: { id: docSnap.id, ...docSnap.data() } as T, error: null };
    } else {
      console.log(`⚠️ Documento no encontrado en ${collectionName}:`, docId);
      return { data: null, error: 'Documento no encontrado' };
    }
  } catch (error: any) {
    console.error(`❌ Error al obtener documento de ${collectionName}:`, error);
    console.error(`❌ Error code:`, error.code);
    
    let friendlyMessage = error.message;
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      friendlyMessage = 'Sin conexión a internet. Por favor verifica tu conexión.';
    }
    
    return { data: null, error: friendlyMessage };
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

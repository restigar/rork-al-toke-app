import { 
  ref, 
  uploadBytes, 
  uploadString,
  getDownloadURL, 
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './firebase';

export const uploadImage = async (
  path: string, 
  imageUri: string,
  isBase64: boolean = false
) => {
  try {
    const storageRef = ref(storage, path);
    
    if (isBase64) {
      await uploadString(storageRef, imageUri, 'data_url');
    } else {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
    }
    
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('✅ Imagen subida:', downloadUrl);
    return { url: downloadUrl, error: null };
  } catch (error: any) {
    console.error('❌ Error al subir imagen:', error.message);
    return { url: null, error: error.message };
  }
};

export const uploadFile = async (path: string, file: Blob) => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('✅ Archivo subido:', downloadUrl);
    return { url: downloadUrl, error: null };
  } catch (error: any) {
    console.error('❌ Error al subir archivo:', error.message);
    return { url: null, error: error.message };
  }
};

export const getFileUrl = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const downloadUrl = await getDownloadURL(storageRef);
    return { url: downloadUrl, error: null };
  } catch (error: any) {
    console.error('❌ Error al obtener URL:', error.message);
    return { url: null, error: error.message };
  }
};

export const deleteFile = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('✅ Archivo eliminado:', path);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('❌ Error al eliminar archivo:', error.message);
    return { success: false, error: error.message };
  }
};

export const listFiles = async (path: string) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    
    const files = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          name: item.name,
          fullPath: item.fullPath,
          url,
        };
      })
    );
    
    return { files, error: null };
  } catch (error: any) {
    console.error('❌ Error al listar archivos:', error.message);
    return { files: [], error: error.message };
  }
};

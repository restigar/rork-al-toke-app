# 📚 Ejemplos de Uso de Firebase en Al-Toke

Esta guía muestra cómo usar Firebase en tu aplicación con ejemplos prácticos.

---

## 🔐 1. Autenticación (Firebase Auth)

### Registrar un nuevo usuario

\`\`\`typescript
import { signUp } from '@/lib/firebase-auth';

// En tu componente de registro
const handleRegister = async () => {
  const { user, error } = await signUp(
    'usuario@example.com',
    'password123',
    'Juan Pérez' // nombre opcional
  );

  if (error) {
    Alert.alert('Error', error);
  } else {
    console.log('Usuario registrado:', user?.uid);
    // Guardar información adicional en Firestore
    await createDocument('users', user!.uid, {
      email: user!.email,
      nombre: 'Juan Pérez',
      tipo: 'cliente',
      telefono: '+54 11 1234-5678',
    });
  }
};
\`\`\`

### Iniciar sesión

\`\`\`typescript
import { signIn } from '@/lib/firebase-auth';

const handleLogin = async () => {
  const { user, error } = await signIn('usuario@example.com', 'password123');

  if (error) {
    Alert.alert('Error', error);
  } else {
    console.log('Usuario autenticado:', user?.uid);
    router.push('/cliente/perfil');
  }
};
\`\`\`

### Cerrar sesión

\`\`\`typescript
import { signOut } from '@/lib/firebase-auth';

const handleLogout = async () => {
  const { error } = await signOut();
  
  if (error) {
    Alert.alert('Error', error);
  } else {
    router.replace('/');
  }
};
\`\`\`

### Escuchar cambios de autenticación

\`\`\`typescript
import { useEffect } from 'react';
import { subscribeToAuthChanges } from '@/lib/firebase-auth';

useEffect(() => {
  const unsubscribe = subscribeToAuthChanges((user) => {
    if (user) {
      console.log('Usuario conectado:', user.uid);
      setCurrentUser(user);
    } else {
      console.log('Usuario desconectado');
      setCurrentUser(null);
    }
  });

  return () => unsubscribe();
}, []);
\`\`\`

---

## 🗄️ 2. Base de Datos (Firestore)

### Crear un comercio

\`\`\`typescript
import { createDocument } from '@/lib/firebase-firestore';
import { getCurrentUser } from '@/lib/firebase-auth';

const handleCreateComercio = async () => {
  const user = getCurrentUser();
  
  if (!user) {
    Alert.alert('Error', 'Debes iniciar sesión');
    return;
  }

  const comercioData = {
    userId: user.uid,
    nombreComercio: 'Panadería El Buen Pan',
    categoria: 'panaderia',
    direccion: 'Av. Corrientes 1234, CABA',
    telefono: '+54 11 4567-8900',
    ubicacion: {
      lat: -34.6037,
      lng: -58.3816,
    },
    horarios: {
      lunes: { abre: '08:00', cierra: '20:00' },
      martes: { abre: '08:00', cierra: '20:00' },
      // ...
    },
    comision: 15,
    activo: true,
  };

  const { success, error } = await createDocument(
    'comercios',
    user.uid, // usar el UID del usuario como ID del comercio
    comercioData
  );

  if (error) {
    Alert.alert('Error', error);
  } else {
    Alert.alert('Éxito', '¡Comercio registrado!');
  }
};
\`\`\`

### Obtener datos de un comercio

\`\`\`typescript
import { getDocument } from '@/lib/firebase-firestore';

const loadComercioData = async (comercioId: string) => {
  const { data, error } = await getDocument('comercios', comercioId);

  if (error) {
    Alert.alert('Error', error);
  } else if (data) {
    console.log('Datos del comercio:', data);
    setComercio(data);
  }
};
\`\`\`

### Obtener todas las ofertas activas

\`\`\`typescript
import { getDocuments, where, orderBy } from '@/lib/firebase-firestore';

const loadOfertasActivas = async () => {
  const { data, error } = await getDocuments('ofertas', [
    where('activa', '==', true),
    orderBy('createdAt', 'desc'),
  ]);

  if (error) {
    Alert.alert('Error', error);
  } else {
    console.log('Ofertas encontradas:', data.length);
    setOfertas(data);
  }
};
\`\`\`

### Actualizar información de usuario

\`\`\`typescript
import { updateDocument } from '@/lib/firebase-firestore';
import { getCurrentUser } from '@/lib/firebase-auth';

const handleUpdateProfile = async () => {
  const user = getCurrentUser();
  
  if (!user) return;

  const { success, error } = await updateDocument('users', user.uid, {
    nombre: 'Juan Carlos Pérez',
    telefono: '+54 11 9999-8888',
  });

  if (error) {
    Alert.alert('Error', error);
  } else {
    Alert.alert('Éxito', 'Perfil actualizado correctamente');
  }
};
\`\`\`

### Crear una oferta

\`\`\`typescript
import { collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createDocument, Timestamp } from '@/lib/firebase-firestore';

const handleCreateOferta = async (comercioId: string) => {
  // Generar un ID único para la oferta
  const ofertaId = doc(collection(db, 'ofertas')).id;

  const ofertaData = {
    comercioId,
    titulo: 'Pizza Napolitana 2x1',
    descripcion: 'Comprando 2 pizzas napolitanas, la segunda es gratis',
    precio: 5000,
    precioDescuento: 2500,
    categoria: 'gastronomia',
    imagenUrl: '', // se subirá después
    fechaInicio: Timestamp.now(),
    fechaFin: Timestamp.fromDate(new Date('2025-12-31')),
    activa: true,
  };

  const { success, error } = await createDocument('ofertas', ofertaId, ofertaData);

  if (error) {
    Alert.alert('Error', error);
  } else {
    Alert.alert('Éxito', 'Oferta creada correctamente');
  }
};
\`\`\`

---

## 📸 3. Almacenamiento de Imágenes (Firebase Storage)

### Subir foto de perfil

\`\`\`typescript
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/lib/firebase-storage';
import { updateDocument } from '@/lib/firebase-firestore';
import { getCurrentUser } from '@/lib/firebase-auth';

const handlePickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled) {
    const user = getCurrentUser();
    if (!user) return;

    setUploading(true);

    // Subir imagen a Firebase Storage
    const path = \`users/\${user.uid}/profile.jpg\`;
    const { url, error } = await uploadImage(path, result.assets[0].uri);

    if (error) {
      Alert.alert('Error', error);
    } else if (url) {
      // Actualizar URL en Firestore
      await updateDocument('users', user.uid, {
        fotoPerfil: url,
      });
      
      setProfileImage(url);
      Alert.alert('Éxito', 'Foto actualizada correctamente');
    }

    setUploading(false);
  }
};
\`\`\`

### Subir imagen de oferta

\`\`\`typescript
import { uploadImage } from '@/lib/firebase-storage';
import { updateDocument } from '@/lib/firebase-firestore';

const handleUploadOfertaImage = async (ofertaId: string, imageUri: string) => {
  setUploading(true);

  const path = \`ofertas/\${ofertaId}/imagen.jpg\`;
  const { url, error } = await uploadImage(path, imageUri);

  if (error) {
    Alert.alert('Error', error);
  } else if (url) {
    // Actualizar URL en la oferta
    await updateDocument('ofertas', ofertaId, {
      imagenUrl: url,
    });
    
    Alert.alert('Éxito', 'Imagen subida correctamente');
  }

  setUploading(false);
};
\`\`\`

### Eliminar imagen

\`\`\`typescript
import { deleteFile } from '@/lib/firebase-storage';

const handleDeleteImage = async (userId: string) => {
  const path = \`users/\${userId}/profile.jpg\`;
  const { success, error } = await deleteFile(path);

  if (error) {
    Alert.alert('Error', error);
  } else {
    Alert.alert('Éxito', 'Imagen eliminada');
  }
};
\`\`\`

---

## 🔍 4. Consultas Avanzadas

### Buscar comercios cercanos (por categoría)

\`\`\`typescript
import { getDocuments, where } from '@/lib/firebase-firestore';

const buscarComerciosPorCategoria = async (categoria: string) => {
  const { data, error } = await getDocuments('comercios', [
    where('categoria', '==', categoria),
    where('activo', '==', true),
  ]);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};
\`\`\`

### Obtener ofertas de un comercio específico

\`\`\`typescript
import { getDocuments, where, orderBy } from '@/lib/firebase-firestore';

const getOfertasComercio = async (comercioId: string) => {
  const { data, error } = await getDocuments('ofertas', [
    where('comercioId', '==', comercioId),
    where('activa', '==', true),
    orderBy('createdAt', 'desc'),
  ]);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};
\`\`\`

### Obtener turnos de farmacia

\`\`\`typescript
import { getDocuments, where, orderBy } from '@/lib/firebase-firestore';
import { Timestamp } from 'firebase/firestore';

const getTurnosFarmacia = async (comercioId: string) => {
  const hoy = Timestamp.now();
  
  const { data, error } = await getDocuments('turnos', [
    where('comercioId', '==', comercioId),
    where('fecha', '>=', hoy),
    orderBy('fecha', 'asc'),
  ]);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};
\`\`\`

---

## 🎣 5. Usar con React Query (Recomendado)

### Hook para obtener ofertas

\`\`\`typescript
import { useQuery } from '@tanstack/react-query';
import { getDocuments, where, orderBy } from '@/lib/firebase-firestore';

export const useOfertas = () => {
  return useQuery({
    queryKey: ['ofertas'],
    queryFn: async () => {
      const { data, error } = await getDocuments('ofertas', [
        where('activa', '==', true),
        orderBy('createdAt', 'desc'),
      ]);

      if (error) throw new Error(error);
      return data;
    },
  });
};

// Uso en componente
const { data: ofertas, isLoading, error } = useOfertas();
\`\`\`

### Hook para crear oferta con mutación

\`\`\`typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDocument } from '@/lib/firebase-firestore';

export const useCreateOferta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ofertaData: any) => {
      const ofertaId = doc(collection(db, 'ofertas')).id;
      const { success, error } = await createDocument('ofertas', ofertaId, ofertaData);
      
      if (error) throw new Error(error);
      return { success, ofertaId };
    },
    onSuccess: () => {
      // Invalidar y refrescar la lista de ofertas
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
    },
  });
};

// Uso en componente
const createOfertaMutation = useCreateOferta();

const handleCrear = () => {
  createOfertaMutation.mutate({
    titulo: 'Nueva oferta',
    // ...resto de datos
  });
};
\`\`\`

---

## ✅ Mejores Prácticas

1. **Siempre maneja errores**: Usa try-catch o verifica el objeto error
2. **Usa React Query**: Para cacheo automático y manejo de estado
3. **Valida datos**: Antes de guardar en Firestore
4. **Optimiza imágenes**: Comprime antes de subir a Storage
5. **Índices de Firestore**: Si haces consultas complejas, crea índices
6. **Reglas de seguridad**: Actualízalas para producción
7. **Logs**: Mantén console.log para debugging

---

¿Necesitas ayuda con algún ejemplo específico? ¡Pregúntame!

# Solución de Errores de Firebase

## Problemas Encontrados y Resueltos

### 1. ❌ Firebase credentials not found in environment variables
**Problema:** Las variables de entorno no se estaban leyendo correctamente.

**Solución:** 
- Se actualizó `lib/firebase.ts` para leer las variables de entorno usando `process.env.EXPO_PUBLIC_FIREBASE_*`
- Se agregaron logs de depuración para verificar qué variables están disponibles

### 2. ❌ Firebase: Error (auth/invalid-api-key)
**Problema:** La API key de Firebase no se estaba pasando correctamente a la inicialización.

**Solución:**
- Se mejoró la configuración de Firebase para validar que todas las credenciales estén presentes
- Se agregó manejo de errores más descriptivo

### 3. ❌ React state update on unmounted component
**Problema:** La función `checkBiometricAvailability()` se estaba llamando síncronamente durante el render en `AuthContext.tsx`, causando actualizaciones de estado antes de que el componente estuviera montado.

**Solución:**
- Se movió la llamada a `checkBiometricAvailability()` a un `useEffect` separado
- Esto asegura que la actualización de estado ocurra después de que el componente esté montado

## Configuración de Variables de Entorno

Tu archivo `.env` debe contener:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyClMWxxt3ssnScAYDaq6Dge0VrMIEzSyG0
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-8462520778-609ca.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://studio-8462520778-609ca-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=studio-8462520778-609ca
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-8462520778-609ca.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=770675581016
EXPO_PUBLIC_FIREBASE_APP_ID=1:770675581016:web:2625d9bd7f471fc2a82a2d
```

**IMPORTANTE:** 
- Todas las variables de Firebase deben comenzar con `EXPO_PUBLIC_` para que Expo las haga disponibles en el cliente
- No debe haber espacios alrededor del signo `=`
- No usar comillas alrededor de los valores

## Cómo Verificar que Firebase Está Funcionando

1. **Reinicia el servidor de desarrollo:**
   ```bash
   # Detén el servidor (Ctrl+C)
   # Luego inicia nuevamente
   npm start
   ```

2. **Verifica los logs en la consola:**
   - Deberías ver: `✅ Firebase app initialized`
   - NO deberías ver: `⚠️ Firebase credentials not found`

3. **Si aún ves errores:**
   - Verifica que el archivo `.env` esté en la raíz del proyecto
   - Asegúrate de que las variables tengan exactamente los valores correctos
   - Reinicia completamente el servidor de desarrollo

## Resguardo de Datos en Firebase

Con la configuración actual:

### ✅ Lo que SÍ se guarda en Firebase:
- **Firebase Authentication:** Todos los usuarios registrados (clientes y comercios)
- **Firebase Storage:** Todas las fotos y archivos que suban los usuarios
- **Firebase Firestore:** Datos estructurados de la aplicación

### ⚠️ Lo que necesitas configurar manualmente en Firebase Console:

1. **Habilitar métodos de autenticación:**
   - Ve a Firebase Console > Authentication > Sign-in method
   - Habilita "Email/Password"

2. **Configurar reglas de Firestore:**
   - Ve a Firebase Console > Firestore Database > Rules
   - Configura reglas de seguridad según tus necesidades

3. **Configurar reglas de Storage:**
   - Ve a Firebase Console > Storage > Rules
   - Configura reglas de seguridad para subida de archivos

## Uso en tu Código

### Autenticación:
```typescript
import { signUp, signIn, signOut } from '@/lib/firebase-auth';

// Registrar usuario
const { user, error } = await signUp(email, password, displayName);

// Iniciar sesión
const { user, error } = await signIn(email, password);

// Cerrar sesión
await signOut();
```

### Firestore:
```typescript
import { saveDocument, getDocument, updateDocument, deleteDocument } from '@/lib/firebase-firestore';

// Guardar documento
await saveDocument('comercios', comercioId, {
  nombre: 'Mi Comercio',
  direccion: '...',
  // ... más datos
});

// Leer documento
const comercio = await getDocument('comercios', comercioId);

// Actualizar
await updateDocument('comercios', comercioId, { nombre: 'Nuevo Nombre' });

// Eliminar
await deleteDocument('comercios', comercioId);
```

### Storage (subir archivos):
```typescript
import { uploadFile, getFileUrl, deleteFile } from '@/lib/firebase-storage';

// Subir archivo
const downloadUrl = await uploadFile(
  fileUri,
  'comercios/logos/logo123.jpg',
  (progress) => console.log(`Progreso: ${progress}%`)
);

// Obtener URL
const url = await getFileUrl('comercios/logos/logo123.jpg');

// Eliminar archivo
await deleteFile('comercios/logos/logo123.jpg');
```

## Próximos Pasos

1. ✅ Verifica que los errores desaparezcan al reiniciar
2. 🔧 Configura las reglas de seguridad en Firebase Console
3. 🔧 Integra las funciones de Firebase en tus pantallas de registro
4. 🔧 Actualiza las pantallas existentes para usar Firebase en lugar de mock data

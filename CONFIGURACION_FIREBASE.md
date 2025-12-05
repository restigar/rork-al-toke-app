# 🔥 Guía de Configuración de Firebase

Esta guía te ayudará a configurar Firebase como base de datos para tu aplicación Al-Toke (Android y iOS).

## 📋 Requisitos Previos

1. Cuenta de Google
2. Acceso a Firebase Console

---

## 🚀 Paso 1: Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Agregar proyecto"** o **"Add project"**
3. Nombra tu proyecto (por ejemplo: "al-toke-app")
4. (Opcional) Puedes desactivar Google Analytics si no lo necesitas
5. Haz clic en **"Crear proyecto"**

---

## 📱 Paso 2: Registrar tu Aplicación

### Para Android:

1. En la consola de Firebase, haz clic en el ícono de Android
2. **Nombre del paquete de Android**: `com.altoke.app` (o el que uses en tu app.json)
3. **Alias de la app**: "Al-Toke Android"
4. Haz clic en **"Registrar app"**
5. **Descarga el archivo `google-services.json`**
   - Este archivo NO es necesario para Expo, pero guárdalo por seguridad
6. Continúa con los siguientes pasos

### Para iOS:

1. En la consola de Firebase, haz clic en el ícono de iOS
2. **ID del paquete de iOS**: `com.altoke.app` (debe coincidir con Android)
3. **Alias de la app**: "Al-Toke iOS"
4. Haz clic en **"Registrar app"**
5. **Descarga el archivo `GoogleService-Info.plist`**
   - Este archivo NO es necesario para Expo, pero guárdalo por seguridad
6. Continúa con los siguientes pasos

---

## 🔑 Paso 3: Obtener las Credenciales de Firebase

1. En la consola de Firebase, ve a **Configuración del proyecto** (ícono de engranaje ⚙️)
2. En la pestaña **General**, baja hasta la sección **"Tus apps"**
3. Encontrarás las configuraciones para cada plataforma (Android/iOS)
4. Haz clic en **"Config"** o busca el objeto `firebaseConfig`

Verás algo como esto:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIzaSyABCDEFG1234567890",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:android:abcdef123456"
};
\`\`\`

---

## 📝 Paso 4: Configurar el archivo `.env`

Abre tu archivo `.env` en la raíz del proyecto y **reemplaza** las credenciales con tus datos de Firebase:

\`\`\`env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyABCDEFG1234567890
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:android:abcdef123456

# Google Maps API Key (mantén la que ya tienes)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCu3psOslG8DEaCpE_Yt9WG_BwDltRnOWc
\`\`\`

### ⚠️ Importante:
- **NO compartas** este archivo `.env` públicamente
- **NO lo subas** a GitHub o control de versiones
- Cada valor debe estar en una sola línea, sin espacios extras

---

## 🗄️ Paso 5: Configurar Firestore Database

1. En Firebase Console, ve a **Firestore Database** en el menú lateral
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Comenzar en modo de prueba"** (para desarrollo)
   - Esto permite lectura/escritura durante 30 días
4. Selecciona una ubicación (elige la más cercana a tu región):
   - `southamerica-east1` (São Paulo) - Recomendado para Argentina
   - `us-central1` (Iowa) - Alternativa
5. Haz clic en **"Habilitar"**

### Configurar Reglas de Seguridad (Importante para producción):

Después de crear la base de datos, ve a la pestaña **"Reglas"** y usa estas reglas básicas:

\`\`\`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura autenticada
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
\`\`\`

---

## 🔐 Paso 6: Configurar Firebase Authentication

1. En Firebase Console, ve a **Authentication** en el menú lateral
2. Haz clic en **"Comenzar"**
3. En la pestaña **"Sign-in method"**, habilita:
   - ✅ **Correo electrónico/Contraseña** (Email/Password)
   - Haz clic en "Habilitar" y guarda

---

## 💾 Paso 7: Configurar Firebase Storage (para imágenes)

1. En Firebase Console, ve a **Storage** en el menú lateral
2. Haz clic en **"Comenzar"**
3. Selecciona **"Comenzar en modo de prueba"** (para desarrollo)
4. Selecciona la misma ubicación que usaste para Firestore
5. Haz clic en **"Listo"**

### Configurar Reglas de Seguridad para Storage:

Ve a la pestaña **"Reglas"** y usa:

\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
\`\`\`

---

## 🎯 Paso 8: Verificar la Configuración

1. **Detén tu servidor de desarrollo** si está corriendo (Ctrl+C)
2. **Reinicia el servidor**:
   \`\`\`bash
   bun start
   \`\`\`
3. Abre la aplicación en tu dispositivo móvil o simulador
4. En la consola, NO deberías ver errores de Firebase
5. Si ves "⚠️ Firebase credentials not found", revisa tu archivo `.env`

---

## 📊 Estructura de la Base de Datos Sugerida

Tu Firestore debería tener estas colecciones:

\`\`\`
/users/{userId}
  - email: string
  - tipo: "cliente" | "comercio"
  - nombre: string
  - telefono: string
  - ubicacion: { lat: number, lng: number }
  - createdAt: timestamp

/comercios/{comercioId}
  - userId: string
  - nombreComercio: string
  - categoria: string
  - direccion: string
  - telefono: string
  - ubicacion: { lat: number, lng: number }
  - horarios: object
  - comision: number
  - activo: boolean
  - createdAt: timestamp

/ofertas/{ofertaId}
  - comercioId: string
  - titulo: string
  - descripcion: string
  - precio: number
  - precioDescuento: number
  - categoria: string
  - imagenUrl: string
  - fechaInicio: timestamp
  - fechaFin: timestamp
  - activa: boolean
  - createdAt: timestamp

/turnos/{turnoId}
  - comercioId: string
  - fecha: timestamp
  - horaInicio: string
  - horaFin: string
  - createdAt: timestamp
\`\`\`

---

## ✅ Checklist Final

- [ ] Proyecto de Firebase creado
- [ ] App Android registrada en Firebase
- [ ] App iOS registrada en Firebase
- [ ] Credenciales copiadas al archivo `.env`
- [ ] Firestore Database habilitado
- [ ] Firebase Authentication habilitado (Email/Password)
- [ ] Firebase Storage habilitado
- [ ] Reglas de seguridad configuradas
- [ ] Servidor reiniciado
- [ ] App funciona sin errores de Firebase

---

## 🆘 Solución de Problemas

### Error: "Firebase credentials not found"
- Verifica que el archivo `.env` esté en la raíz del proyecto
- Asegúrate de que todas las variables comiencen con `EXPO_PUBLIC_`
- Reinicia el servidor después de modificar el `.env`

### Error: "Permission denied" en Firestore
- Revisa las reglas de seguridad en Firestore
- Asegúrate de que el usuario esté autenticado

### Error: "No Firebase App"
- Verifica que todas las credenciales estén correctas
- Comprueba que no haya espacios extras en el `.env`

### La app no se conecta en dispositivo físico
- Asegúrate de estar usando el mismo túnel/URL
- Verifica que las credenciales de Firebase sean las correctas
- Revisa la consola de Firebase para ver si hay solicitudes entrantes

---

## 📞 Necesitas Ayuda?

Si tienes problemas con la configuración, proporciónanos:
1. Captura de pantalla de tu Firebase Console
2. El mensaje de error específico que ves
3. Confirma que completaste todos los pasos anteriores

---

## 🔄 Próximos Pasos

Una vez que Firebase esté configurado, necesitarás:
1. Migrar los datos de Supabase a Firebase (si tienes datos existentes)
2. Actualizar el código de autenticación para usar Firebase Auth
3. Actualizar las consultas de base de datos para usar Firestore
4. Actualizar la carga de imágenes para usar Firebase Storage

¿Quieres que te ayude con alguno de estos pasos?

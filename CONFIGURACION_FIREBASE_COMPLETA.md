# Configuración Completa de Firebase

## ✅ Lo que YA está configurado en el código

1. **Firebase Authentication** - Registro de usuarios
2. **Firebase Firestore** - Base de datos
3. **Firebase Storage** - Almacenamiento de archivos
4. **Integración en registros** - Los nuevos usuarios se guardan en Firebase

## 🔧 Configuraciones que DEBES hacer en Firebase Console

### 1. Activar Firebase Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Authentication** (Autenticación)
4. Haz clic en **Get Started** (Comenzar)
5. Ve a la pestaña **Sign-in method** (Método de inicio de sesión)
6. Activa los siguientes proveedores:
   - ✅ **Email/Password** (Email/Contraseña) - OBLIGATORIO
   - ✅ **Google** (opcional - para login con Google)
   - ✅ **Apple** (opcional - para login con Apple)
   - ✅ **Facebook** (opcional - para login con Facebook)

### 2. Configurar Firestore Database

1. En el menú lateral, ve a **Firestore Database**
2. Haz clic en **Create database** (Crear base de datos)
3. Selecciona el modo:
   - **Modo de producción** (recomendado) - con reglas de seguridad
   - **Modo de prueba** (solo para desarrollo) - sin reglas de seguridad
4. Elige la ubicación (región más cercana a tus usuarios)
5. Haz clic en **Enable** (Habilitar)

#### Reglas de Seguridad de Firestore (Recomendadas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura de clientes solo al usuario autenticado
    match /clientes/{clienteId} {
      allow read, write: if request.auth != null && request.auth.uid == clienteId;
    }
    
    // Permitir lectura/escritura de comercios solo al usuario autenticado
    match /comercios/{comercioId} {
      allow read, write: if request.auth != null && request.auth.uid == comercioId;
    }
    
    // Permitir a todos leer las ofertas (para búsqueda)
    match /ofertas/{ofertaId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Permitir a todos leer los comercios (para búsqueda)
    match /comercios/{comercioId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == comercioId;
    }
  }
}
```

### 3. Configurar Firebase Storage

1. En el menú lateral, ve a **Storage**
2. Haz clic en **Get Started** (Comenzar)
3. Acepta las reglas de seguridad predeterminadas
4. Elige la ubicación (misma que Firestore)
5. Haz clic en **Done** (Listo)

#### Reglas de Seguridad de Storage (Recomendadas)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir subir imágenes de perfil solo al usuario autenticado
    match /usuarios/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir subir imágenes de ofertas solo al comercio autenticado
    match /ofertas/{comercioId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == comercioId;
    }
    
    // Permitir subir logos de comercios solo al comercio autenticado
    match /comercios/{comercioId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == comercioId;
    }
  }
}
```

### 4. Configurar Variables de Entorno (Ya deberías tenerlo)

Verifica que tu archivo `.env` tenga todas estas variables (ya configuradas):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://tu_proyecto.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 📊 Estructura de Datos en Firestore

### Colección: `clientes`
```javascript
{
  id: "firebase_uid",
  name: "Juan Pérez",
  email: "juan@ejemplo.com",
  type: "cliente",
  numeroCliente: "1001",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: `comercios`
```javascript
{
  id: "firebase_uid",
  name: "Mi Negocio",
  nombre: "Mi Negocio",
  email: "negocio@ejemplo.com",
  type: "comercio",
  numeroComercio: "2001",
  telefono: "+54 11 1234-5678",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Colección: `ofertas` (para cuando implementes la carga de ofertas)
```javascript
{
  id: "oferta_id",
  comercioId: "firebase_uid_del_comercio",
  titulo: "50% en pizzas",
  descripcion: "Oferta válida hasta fin de mes",
  precio: 1500,
  precioOriginal: 3000,
  descuento: 50,
  imagenUrl: "https://firebase_storage_url...",
  validoHasta: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔒 Seguridad Adicional

### Índices de Firestore (Recomendados)

Cuando empiezas a hacer consultas complejas, Firebase te pedirá crear índices. Puedes crearlos desde la consola o automáticamente cuando ejecutas una consulta que los requiera.

### Límites de Firebase (Plan Gratuito Spark)

- **Authentication**: 10,000 verificaciones/mes
- **Firestore**: 
  - 50,000 lecturas/día
  - 20,000 escrituras/día
  - 20,000 borrados/día
  - 1 GB almacenamiento
- **Storage**: 
  - 5 GB almacenamiento
  - 1 GB transferencia/día

## ✅ Verificar que todo funciona

### 1. Prueba el registro de cliente
```bash
# Registra un usuario desde la app
# Ve a Firebase Console > Authentication > Users
# Deberías ver el nuevo usuario
```

### 2. Verifica Firestore
```bash
# Ve a Firebase Console > Firestore Database
# Deberías ver las colecciones "clientes" o "comercios"
# Con los documentos de los usuarios registrados
```

### 3. Prueba subir una imagen (cuando implementes)
```bash
# Ve a Firebase Console > Storage
# Deberías ver las carpetas con las imágenes subidas
```

## 🚀 Próximos pasos

Para que las fotos y archivos se suban automáticamente a Firebase, necesitas modificar las pantallas donde los usuarios suben imágenes (como cargar ofertas, editar perfil, etc.) para usar `uploadImage` de `lib/firebase-storage.ts`.

¿Quieres que integre la subida de imágenes en alguna pantalla específica?

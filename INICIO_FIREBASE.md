# 🚀 Configuración Rápida de Firebase - INICIO AQUÍ

## 📋 Lo que necesito de ti:

Para configurar Firebase, necesito que me proporciones las siguientes credenciales de tu proyecto Firebase:

### 1️⃣ Crear Proyecto en Firebase
1. Ve a: https://console.firebase.google.com/
2. Crea un nuevo proyecto (nombre: "al-toke-app" o el que prefieras)
3. Registra tu app para **Android** y **iOS**

### 2️⃣ Obtener Credenciales

En Firebase Console → ⚙️ Configuración del proyecto → Tus apps → Config

Necesito estos 6 valores:

```
apiKey: "AIzaSy..."
authDomain: "tu-proyecto.firebaseapp.com"
projectId: "tu-proyecto"
storageBucket: "tu-proyecto.appspot.com"
messagingSenderId: "123456789"
appId: "1:123456789:android:abc..."
```

### 3️⃣ Servicios a Habilitar

En la consola de Firebase, habilita:
- ✅ **Authentication** → Email/Password
- ✅ **Firestore Database** → Modo de prueba
- ✅ **Storage** → Modo de prueba

---

## 📁 Archivos Creados

He creado los siguientes archivos para facilitar la configuración:

### 1. **lib/firebase.ts** 
Configuración principal de Firebase (reemplaza lib/supabase.ts)

### 2. **lib/firebase-auth.ts**
Funciones de autenticación:
- `signIn(email, password)`
- `signUp(email, password, displayName)`
- `signOut()`
- `resetPassword(email)`
- `getCurrentUser()`

### 3. **lib/firebase-firestore.ts**
Funciones de base de datos:
- `createDocument(collection, id, data)`
- `getDocument(collection, id)`
- `getDocuments(collection, constraints)`
- `updateDocument(collection, id, data)`
- `deleteDocument(collection, id)`

### 4. **lib/firebase-storage.ts**
Funciones de almacenamiento:
- `uploadImage(path, imageUri)`
- `getFileUrl(path)`
- `deleteFile(path)`

### 5. **env.example**
Template con las variables de entorno necesarias

---

## 🎯 Próximos Pasos

**PASO 1:** Crea tu proyecto en Firebase y dame las 6 credenciales

**PASO 2:** Las pegaré en tu archivo `.env`

**PASO 3:** Habilitamos los servicios en Firebase Console

**PASO 4:** Actualizamos tu código para usar Firebase en lugar de Supabase

---

## 📚 Documentación Completa

- **CONFIGURACION_FIREBASE.md** - Guía paso a paso detallada
- **EJEMPLOS_FIREBASE.md** - Ejemplos de código para usar en tu app

---

## ✅ Checklist

- [ ] Proyecto Firebase creado
- [ ] App Android registrada
- [ ] App iOS registrada
- [ ] 6 credenciales obtenidas
- [ ] Authentication habilitado
- [ ] Firestore habilitado
- [ ] Storage habilitado

---

## 🆘 ¿Qué hacer ahora?

**Opción A:** Ya tengo las credenciales → Dame los 6 valores y las configuro

**Opción B:** Necesito ayuda creando el proyecto → Te guío paso a paso

**Opción C:** Quiero ver la documentación completa → Lee CONFIGURACION_FIREBASE.md

---

¿Cuál opción prefieres? ¿Ya tienes las credenciales de Firebase?

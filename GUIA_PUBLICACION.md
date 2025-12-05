# 🚀 Guía de Publicación - Al Toke App

## Tabla de Contenidos
1. [Preparación Previa](#preparación-previa)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Configuración de EAS](#configuración-de-eas)
4. [Publicación en iOS (App Store)](#publicación-en-ios)
5. [Publicación en Android (Google Play)](#publicación-en-android)
6. [Verificación Post-Publicación](#verificación-post-publicación)
7. [Solución de Problemas](#solución-de-problemas)

---

## 📋 Preparación Previa

### 1. Cuentas Necesarias

#### Apple Developer Program (iOS)
- **Costo:** $99 USD/año
- **Registro:** https://developer.apple.com/programs/
- **Requisitos:**
  - ID de Apple
  - Tarjeta de crédito/débito válida
  - Verificación de identidad (puede tomar 24-48 horas)

#### Google Play Console (Android)
- **Costo:** $25 USD (pago único)
- **Registro:** https://play.google.com/console/signup
- **Requisitos:**
  - Cuenta de Google
  - Tarjeta de crédito/débito válida
  - Verificación puede tomar 24-48 horas

#### Expo Account
- **Costo:** Gratis (plan Free suficiente para empezar)
- **Registro:** https://expo.dev/signup
- **Necesario para:** EAS Build y Submit

### 2. Software Necesario

```bash
# Instalar Node.js (si no lo tienes)
# Descargar de: https://nodejs.org/ (versión LTS recomendada)

# Instalar Bun (si no lo tienes)
curl -fsSL https://bun.sh/install | bash

# Instalar EAS CLI
bun i -g @expo/eas-cli

# Verificar instalación
eas --version
```

### 3. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env` contenga:

```env
EXPO_PUBLIC_SUPABASE_URL=https://fnghohlajpfgwocjsmht.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCu3psOslG8DEaCpE_Yt9WG_BwDltRnOWc
```

**⚠️ IMPORTANTE:** Estas credenciales deben ser de PRODUCCIÓN, no de desarrollo.

---

## 🗄️ Configuración de Supabase

### Paso 1: Acceder a tu Proyecto de Supabase

1. Ve a https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `fnghohlajpfgwocjsmht`

### Paso 2: Crear la Base de Datos

1. En el panel izquierdo, ve a **SQL Editor**
2. Haz clic en **New Query**
3. Copia y pega todo el contenido de `supabase_schema.sql`
4. Haz clic en **Run** (o presiona Ctrl+Enter)
5. Verifica que no haya errores

### Paso 3: Verificar las Tablas

1. Ve a **Table Editor** en el menú izquierdo
2. Deberías ver estas tablas:
   - ✅ clientes
   - ✅ comercios
   - ✅ ofertas
   - ✅ ofertas_dia

### Paso 4: Configurar Row Level Security (RLS)

**Importante:** Por seguridad, debes ajustar las políticas RLS cuando implementes autenticación real.

Para empezar (modo desarrollo/testing):
1. Ve a **Authentication** → **Policies**
2. Verifica que las políticas básicas estén activas
3. Las políticas actuales permiten lectura pública (ajustar en producción según tus necesidades)

### Paso 5: Probar la Conexión

Desde tu aplicación, ejecuta:

```bash
# Iniciar la app
bun run start-web

# En la app, navega a la pantalla de prueba de Supabase
# La ruta es: /test-supabase
```

---

## ⚙️ Configuración de EAS

### Paso 1: Iniciar Sesión en Expo

```bash
# Iniciar sesión
eas login

# Verificar que estás logueado
eas whoami
```

### Paso 2: Configurar el Proyecto

```bash
# Navegar a la carpeta del proyecto
cd /home/user/rork-app

# Inicializar configuración de EAS
eas build:configure
```

Esto creará un archivo `eas.json` con configuraciones de build.

### Paso 3: Revisar y Ajustar `eas.json`

Asegúrate de que tu `eas.json` se vea similar a esto:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://fnghohlajpfgwocjsmht.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "tu_key_aqui",
        "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY": "tu_key_aqui"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**⚠️ IMPORTANTE:** 
- NO subas `eas.json` con credenciales a repositorios públicos
- Considera usar Expo Secrets: https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables

---

## 📱 Publicación en iOS

### Requisitos Previos
- ✅ Cuenta de Apple Developer activa
- ✅ Certificados y perfiles configurados (EAS lo hace automáticamente)

### Paso 1: Preparar Assets de App Store

Necesitarás preparar:

1. **Capturas de Pantalla**
   - iPhone 6.5": 1242 x 2688 px (requerido)
   - iPhone 5.5": 1242 x 2208 px (requerido)
   - iPad Pro 12.9": 2048 x 2732 px (opcional)
   
   **Tip:** Usa simuladores iOS o dispositivos reales para tomar capturas

2. **Íconos**
   - Ya están configurados en `assets/images/icon.png`
   - Verifica que sea 1024x1024 px

3. **Información de la App**
   - **Nombre:** Al Toke App
   - **Subtítulo:** Lo que buscas, está cerca de vos
   - **Descripción:** (Preparar una descripción atractiva)
   - **Palabras clave:** comercios, ofertas, descuentos, local, cerca
   - **Categoría:** Shopping o Local Business

4. **Documentos Legales**
   - URL de Política de Privacidad (obligatorio)
   - URL de Términos de Servicio
   - Información de contacto

### Paso 2: Construir para iOS

```bash
# Construcción para producción
eas build --platform ios --profile production

# El proceso tomará 15-30 minutos
# EAS te enviará una notificación cuando termine
```

Durante el proceso:
- EAS creará automáticamente certificados si no existen
- Te pedirá acceso a tu cuenta de Apple Developer
- Generará el archivo `.ipa` para subir a App Store

### Paso 3: Subir a App Store Connect

**Opción A: Usando EAS Submit (Recomendado)**

```bash
eas submit --platform ios

# Sigue las instrucciones en pantalla:
# - Selecciona el build recién creado
# - Proporciona credenciales de App Store Connect
# - Confirma la subida
```

**Opción B: Manual desde App Store Connect**

1. Ve a https://appstoreconnect.apple.com
2. Crea una nueva app
3. Completa la información requerida
4. Sube el archivo `.ipa` desde EAS
5. Completa screenshots, descripciones, etc.
6. Envía para revisión

### Paso 4: Revisión de Apple

- **Tiempo estimado:** 1-3 días
- Apple revisará:
  - Funcionalidad de la app
  - Cumplimiento de guidelines
  - Privacidad y permisos
  - Contenido apropiado

**Consejos:**
- Asegúrate de que todos los permisos estén justificados
- Provee instrucciones claras para el revisor
- Si usan funciones especiales, explícalas

### Paso 5: Publicación

Una vez aprobada:
1. Puedes publicar inmediatamente
2. O programar una fecha de lanzamiento
3. La app estará disponible en App Store en 24 horas

---

## 🤖 Publicación en Android

### Requisitos Previos
- ✅ Cuenta de Google Play Console activa
- ✅ Información de contacto y dirección

### Paso 1: Preparar Assets de Google Play

Necesitarás:

1. **Capturas de Pantalla**
   - Teléfono: 16:9 ratio, mínimo 320px
   - Tablet 7": 16:9 ratio (opcional)
   - Tablet 10": 16:9 ratio (opcional)
   - Al menos 2 capturas, máximo 8

2. **Gráfico de Funciones**
   - 1024 x 500 px
   - PNG o JPG

3. **Ícono de Alta Resolución**
   - 512 x 512 px
   - PNG de 32 bits

4. **Descripción**
   - Breve: 80 caracteres
   - Completa: hasta 4000 caracteres

### Paso 2: Construir para Android

```bash
# Construcción para producción
eas build --platform android --profile production

# El proceso tomará 10-20 minutos
```

Durante el proceso:
- EAS creará automáticamente el keystore
- Generará el archivo `.aab` (Android App Bundle)

**⚠️ IMPORTANTE:** Guarda el keystore generado de forma segura. Lo necesitarás para futuras actualizaciones.

### Paso 3: Crear la App en Google Play Console

1. Ve a https://play.google.com/console
2. Haz clic en **Crear app**
3. Completa:
   - Nombre de la app: **Al Toke App**
   - Idioma predeterminado: Español
   - Tipo de app: App
   - Gratuita/De pago: Gratuita
4. Acepta las declaraciones

### Paso 4: Configurar la Ficha de Play Store

1. **Panel principal** → **Configurar tu aplicación**
2. Completa todas las secciones obligatorias:
   - Categoría de la app
   - Información de contacto
   - Política de privacidad
   - Gráficos de la app (íconos, capturas)

### Paso 5: Subir el Build

**Opción A: Usando EAS Submit (Recomendado)**

```bash
eas submit --platform android

# Sigue las instrucciones:
# - Selecciona el build
# - Proporciona credenciales de Google Play
# - Confirma la subida
```

**Opción B: Manual desde Google Play Console**

1. Ve a **Producción** → **Crear nueva versión**
2. Sube el archivo `.aab` descargado de EAS
3. Completa las notas de la versión
4. Revisa y publica

### Paso 6: Clasificación de Contenido

1. Ve a **Clasificación de contenido**
2. Completa el cuestionario
3. Obtén tu clasificación

### Paso 7: Países de Distribución

1. Ve a **Países y regiones**
2. Selecciona los países donde quieres distribuir
3. Argentina debería estar seleccionado

### Paso 8: Revisión y Publicación

1. Completa todas las secciones obligatorias (marque verde)
2. Ve a **Producción**
3. Haz clic en **Enviar a revisión**

- **Tiempo estimado:** Unas pocas horas a 2 días
- Google revisará la app automáticamente
- Una vez aprobada, estará disponible en Google Play

---

## ✅ Verificación Post-Publicación

### Checklist de Verificación

#### Después de iOS
- [ ] Descargar la app desde App Store
- [ ] Probar registro de cliente
- [ ] Probar registro de comercio
- [ ] Verificar búsquedas con IA
- [ ] Probar geolocalización
- [ ] Verificar que las ofertas se muestren
- [ ] Probar autenticación biométrica
- [ ] Revisar enlaces a WhatsApp
- [ ] Verificar mapas funcionan

#### Después de Android
- [ ] Descargar la app desde Google Play
- [ ] Probar las mismas funcionalidades que iOS
- [ ] Verificar permisos de ubicación
- [ ] Probar en diferentes tamaños de pantalla

### Monitoreo Inicial

**Primeras 24 horas:**
- Revisar reseñas y calificaciones
- Monitorear reportes de crashes
- Verificar métricas de descarga
- Responder a comentarios de usuarios

**Primera semana:**
- Analizar comportamiento de usuarios
- Identificar funcionalidades más usadas
- Detectar bugs reportados
- Preparar actualizaciones si es necesario

---

## 🔧 Solución de Problemas

### Error: "EXPO_PUBLIC_SUPABASE_URL is required"

**Solución:**
```bash
# Verifica que .env existe y tiene las variables
cat .env

# Si no existe, créalo con:
echo 'EXPO_PUBLIC_SUPABASE_URL=tu_url' > .env
echo 'EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key' >> .env

# Reinicia el servidor
bun run start
```

### Error: "Build failed" en EAS

**Solución:**
```bash
# Limpiar caché de Expo
bunx expo start --clear

# Verificar que todas las dependencias estén instaladas
bun install

# Intentar build nuevamente con más información
eas build --platform ios --profile production --clear-cache
```

### Error: "Maps not working on web"

**Esto es esperado.** react-native-maps no funciona en web. La app automáticamente usa una versión sin mapas para web.

### Error: "Biometric authentication not working"

**En simuladores iOS/Android:** La autenticación biométrica no funciona en simuladores. Prueba en dispositivos reales.

**En web:** La autenticación biométrica no está disponible en web (es esperado).

### Build rechazado por Apple

**Razones comunes:**
1. Permisos no justificados correctamente
2. Funcionalidades que no cumplen guidelines
3. Falta de información para reviewers

**Solución:**
- Lee el feedback de Apple cuidadosamente
- Ajusta según las recomendaciones
- Vuelve a enviar con explicaciones claras

### Build rechazado por Google

**Menos común que Apple**, pero puede pasar.

**Solución:**
- Revisa el correo de Google Play
- Corrige los problemas indicados
- Sube una nueva versión

---

## 📈 Actualizaciones Futuras

### Preparar una Actualización

```bash
# 1. Actualizar versión en app.json
# Cambia "version": "1.0.0" a "version": "1.0.1"

# 2. Construir nueva versión
eas build --platform all --profile production

# 3. Subir a las tiendas
eas submit --platform ios
eas submit --platform android
```

### Buenas Prácticas
- Incrementa el número de versión con cada actualización
- Documenta los cambios en las notas de versión
- Prueba exhaustivamente antes de publicar
- Considera un rollout gradual (disponible en Google Play)

---

## 📞 Soporte y Recursos

### Documentación Oficial
- **Expo:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **EAS Submit:** https://docs.expo.dev/submit/introduction/
- **Supabase:** https://supabase.com/docs
- **Apple Developer:** https://developer.apple.com/
- **Google Play:** https://developer.android.com/

### Contacto de Soporte
- **Email:** info@al-toke.com
- **WhatsApp:** +54 9 3756 44-1056

---

## 🎉 ¡Felicidades!

Si seguiste todos estos pasos, tu app **Al Toke** debería estar publicada y disponible para usuarios en App Store y Google Play.

**Próximos pasos recomendados:**
1. Promocionar la app localmente
2. Recopilar feedback de usuarios
3. Monitorear analytics
4. Planificar próximas funcionalidades
5. Mantener la app actualizada

**¡Éxito con tu lanzamiento! 🚀**

---

*Última actualización: Noviembre 2025*

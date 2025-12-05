# 📋 Instrucciones para Configurar el Panel de Administración

## 🎯 Resumen
Este documento contiene las instrucciones paso a paso para configurar el panel de administración de Al Toke, incluyendo la base de datos en Supabase y la configuración de variables de entorno.

---

## 📊 Paso 1: Ejecutar el Script SQL en Supabase

### 1.1 Acceder a Supabase
1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto de Al Toke

### 1.2 Abrir el Editor SQL
1. En el panel lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"** (Nueva consulta)

### 1.3 Ejecutar el Script
1. Abre el archivo `supabase_schema.sql` ubicado en la raíz del proyecto
2. Copia **TODO** el contenido del archivo
3. Pégalo en el editor SQL de Supabase
4. Haz clic en **"Run"** (Ejecutar) o presiona `Ctrl + Enter` / `Cmd + Enter`

### 1.4 Verificar la Ejecución
Deberías ver un mensaje de confirmación al final:
```
✅ Base de datos configurada exitosamente
Tablas creadas: administradores, comisiones, auditoria_admin, clientes, comercios, ofertas, ofertas_dia
Índices, triggers y RLS configurados
Vistas creadas: vista_ofertas_activas, vista_ofertas_dia_activas
```

### 1.5 Verificar las Tablas Creadas
1. Ve a **"Table Editor"** en el panel lateral
2. Deberías ver las siguientes tablas:
   - ✅ administradores
   - ✅ auditoria_admin
   - ✅ clientes
   - ✅ comercios
   - ✅ comisiones
   - ✅ ofertas
   - ✅ ofertas_dia

---

## 🔐 Paso 2: Obtener las Credenciales de Supabase

### 2.1 Obtener la URL del Proyecto
1. Ve a **"Project Settings"** (Configuración del proyecto)
2. En la sección **"API"**, copia el valor de **"Project URL"**
3. Ejemplo: `https://abcdefghijklmnop.supabase.co`

### 2.2 Obtener la Clave Anónima (Anon Key)
1. En la misma sección **"API"**
2. Copia el valor de **"anon public"** key
3. Ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.3 Obtener la Service Role Key (Importante)
1. En la misma sección **"API"**
2. Busca **"service_role"** key
3. ⚠️ **IMPORTANTE**: Esta clave tiene acceso completo a la base de datos. NO la compartas ni la expongas públicamente.
4. Copia el valor

---

## ⚙️ Paso 3: Configurar Variables de Entorno

### 3.1 Editar el Archivo `.env`
1. Abre el archivo `env` en la raíz del proyecto (o crea uno si no existe)
2. Agrega o actualiza las siguientes variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui

# Service Role Key (para backend/admin)
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui

# Admin Configuration
ADMIN_JWT_SECRET=genera_un_secret_aleatorio_seguro_aqui
```

### 3.2 Generar un JWT Secret
Puedes generar un secret aleatorio usando:
- Online: [https://generate-random.org/api-key-generator](https://generate-random.org/api-key-generator)
- Terminal: `openssl rand -base64 32`
- Node: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## 👤 Paso 4: Crear el Primer Administrador

### Opción A: Usar el Administrador de Prueba (Ya creado)
El script SQL ya creó un administrador de prueba:
- **Email**: `admin@altoke.com`
- **Contraseña**: Deberás configurarla manualmente (ver siguiente paso)

### Opción B: Crear un Nuevo Administrador
1. Ve a **"Table Editor"** en Supabase
2. Selecciona la tabla **"administradores"**
3. Haz clic en **"Insert row"** (Insertar fila)
4. Llena los campos:
   - **email**: Tu email de administrador
   - **nombre**: Tu nombre
   - **rol**: `super_admin` (para tener todos los permisos)
   - **activo**: `true`
   - Los demás campos se llenarán automáticamente

### 4.1 Configurar Contraseña
⚠️ **IMPORTANTE**: El sistema actual usa el middleware de autenticación que necesitas configurar.

Por ahora, el login de admin está configurado para usar las credenciales de Supabase. Necesitarás:
1. Implementar un sistema de hash de contraseñas (bcrypt)
2. O usar Supabase Auth para administradores

**Recomendación temporal para desarrollo:**
Puedes modificar temporalmente el archivo `backend/trpc/routes/admin/auth/login.ts` para usar una contraseña hardcodeada mientras configuras el sistema de autenticación completo.

---

## 🚀 Paso 5: Acceder al Panel de Administración

### 5.1 Iniciar la Aplicación
```bash
npm start
# o
bun start
```

### 5.2 Acceder al Login
1. En la pantalla principal de la app, verás un pequeño ícono de escudo (🛡️) en la esquina superior izquierda
2. Haz clic en él para acceder al **Login de Administrador**
3. Ingresa tus credenciales:
   - Email del administrador
   - Contraseña configurada

### 5.3 Explorar el Dashboard
Una vez dentro, tendrás acceso a:
- 📊 **Estadísticas**: Resumen de comercios, clientes, comisiones
- 🏪 **Gestión de Comercios**: Ver, aprobar, editar comercios
- 🖼️ **Gestionar Fotos**: Cargar fotos de comercios
- 👥 **Gestión de Clientes**: Ver y editar perfiles
- 💰 **Comisiones**: Configurar planes y tarifas
- 👤 **Administradores**: Agregar nuevos admins
- ⚙️ **Configuración**: Ajustes generales

---

## 🔒 Seguridad y Mejores Prácticas

### ✅ Recomendaciones Importantes

1. **Variables de Entorno**
   - ❌ NUNCA subas el archivo `.env` a Git
   - ✅ Asegúrate de que `.env` esté en `.gitignore`
   - ✅ Usa variables distintas para desarrollo y producción

2. **Contraseñas**
   - ❌ No uses contraseñas simples
   - ✅ Usa contraseñas largas y complejas
   - ✅ Implementa hash con bcrypt o similar

3. **Service Role Key**
   - ❌ NUNCA la uses en el frontend
   - ✅ Solo úsala en el backend
   - ✅ No la compartas con nadie

4. **JWT Secret**
   - ✅ Usa un secret largo y aleatorio
   - ✅ Cámbialo periódicamente
   - ✅ Nunca lo expongas públicamente

5. **Permisos**
   - ✅ Revisa regularmente los permisos de administradores
   - ✅ Usa el rol `moderador` para usuarios con menos privilegios
   - ✅ Audita las acciones usando la tabla `auditoria_admin`

---

## 🐛 Solución de Problemas

### Error: "supabaseUrl is required"
**Solución**: 
- Verifica que `EXPO_PUBLIC_SUPABASE_URL` esté configurado en `.env`
- Reinicia el servidor de desarrollo

### Error: "Invalid API key"
**Solución**:
- Verifica que `EXPO_PUBLIC_SUPABASE_ANON_KEY` sea correcta
- Asegúrate de copiar la clave completa sin espacios extras

### Error: "Unable to resolve path to module '@/lib/trpc'"
**Solución**:
- Es un warning del linter, no afecta la funcionalidad
- El proyecto usa path mapping en `tsconfig.json`

### No puedo hacer login como administrador
**Solución**:
1. Verifica que el administrador existe en la tabla `administradores`
2. Revisa que el campo `activo` sea `true`
3. Verifica la configuración del middleware de autenticación
4. Revisa los logs del backend en la consola

---

## 📝 Próximos Pasos

Una vez configurado el panel de administración, puedes:

1. ✅ Crear más administradores desde el panel
2. ✅ Configurar las comisiones y planes
3. ✅ Aprobar y gestionar comercios
4. ✅ Cargar fotos de comercios
5. ✅ Monitorear la actividad en `auditoria_admin`

---

## 💡 Datos de Prueba

El script SQL ya incluye algunos datos de prueba:

### Administrador
- Email: `admin@altoke.com`
- Rol: `super_admin`

### Comisiones
- Comisión Estándar: 10% sobre ventas
- Plan Básico: $5000/mes
- Plan Premium: $15000/mes

### Cliente de Prueba
- Email: `cliente@test.com`
- Número: `CLI-0001`

### Comercio de Prueba
- Email: `comercio@test.com`
- Número: `COM-0001`

---

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa los logs en la consola
2. Verifica que todas las variables de entorno estén correctas
3. Asegúrate de que Supabase esté respondiendo correctamente
4. Contacta al equipo de desarrollo si el problema persiste

---

**¡Panel de Administración configurado! 🎉**

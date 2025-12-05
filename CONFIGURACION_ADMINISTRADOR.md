# 📋 Configuración de Usuario Administrador

## ✅ Cambios Realizados

### 1. **Eliminación del Botón de Admin**
- Se eliminó el icono de Shield (escudo) que aparecía en la pantalla principal
- Ya no existe acceso directo a `/admin/login`

### 2. **Login Unificado**
- Ahora el login de administrador está integrado en la pantalla principal
- Cuando inicias sesión con credenciales de administrador, automáticamente te redirige al panel de administración
- Si no eres administrador, procede con el login normal de comercio/cliente

### 3. **Flujo de Autenticación**
```
Usuario ingresa email + contraseña
    ↓
¿Es administrador?
    ├─ Sí → Redirige a /admin/dashboard
    └─ No → Verifica si es comercio → Redirige según corresponda
```

## 🔧 Pasos para Configurar tu Usuario Administrador

### Paso 1: Crear Usuario en Supabase Auth
1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Ve a **Authentication** → **Users**
3. Haz clic en **Add user** → **Create new user**
4. Completa los datos:
   - **Email**: `restigar00@gmail.com`
   - **Password**: `Steisy458633@`
   - **Auto Confirm User**: ✅ (activado)
5. Haz clic en **Create user**

### Paso 2: Ejecutar Script SQL
1. En Supabase, ve a **SQL Editor**
2. Haz clic en **New query**
3. Copia y pega el contenido del archivo `supabase_admin_setup.sql`:

```sql
-- Script para agregar usuario administrador
INSERT INTO administradores (email, nombre, rol, permisos, activo)
VALUES (
  'restigar00@gmail.com',
  'Administrador Propietario',
  'super_admin',
  '{
    "gestionar_comercios": true,
    "gestionar_clientes": true,
    "gestionar_ofertas": true,
    "gestionar_comisiones": true,
    "gestionar_admins": true
  }'::JSONB,
  true
)
ON CONFLICT (email) 
DO UPDATE SET
  rol = 'super_admin',
  permisos = '{
    "gestionar_comercios": true,
    "gestionar_clientes": true,
    "gestionar_ofertas": true,
    "gestionar_comisiones": true,
    "gestionar_admins": true
  }'::JSONB,
  activo = true,
  updated_at = NOW();
```

4. Haz clic en **Run** para ejecutar el script

### Paso 3: Verificar Configuración
Ejecuta esta consulta en el SQL Editor para verificar que todo esté correcto:

```sql
SELECT 
  id,
  email,
  nombre,
  rol,
  permisos,
  activo,
  created_at
FROM administradores
WHERE email = 'restigar00@gmail.com';
```

Deberías ver tu usuario con:
- **Rol**: `super_admin`
- **Activo**: `true`
- **Permisos**: Todos en `true`

## 🎯 Cómo Iniciar Sesión como Administrador

1. Abre la aplicación Al Toke
2. Haz clic en el botón **"Iniciar sesión"** (esquina superior derecha)
3. Ingresa tus credenciales:
   - **Email**: `restigar00@gmail.com`
   - **Contraseña**: `Steisy458633@`
4. Haz clic en **"Entrar"**
5. Serás redirigido automáticamente al **Panel de Administración**

## 🔐 Seguridad

- El login usa Supabase Auth para validar las credenciales
- Las contraseñas están hasheadas y protegidas
- El token de sesión se guarda en AsyncStorage de forma segura
- Solo usuarios en la tabla `administradores` con `activo = true` pueden acceder

## 📱 Funcionalidades del Panel Admin

Una vez dentro del panel de administración, podrás:

✅ Ver estadísticas generales (comercios, clientes, comisiones)
✅ Gestionar comercios (aprobar, editar, suspender)
✅ Gestionar clientes
✅ Cargar y editar fotos de comercios
✅ Configurar comisiones y planes
✅ Agregar otros administradores
✅ Acceder a configuración general

## 🐛 Resolución de Problemas

### No puedo iniciar sesión
1. Verifica que el usuario exista en **Supabase Auth** → **Users**
2. Verifica que el usuario esté en la tabla `administradores`
3. Verifica que `activo = true` en la tabla
4. Verifica que las credenciales de Supabase estén configuradas en el archivo `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=tu_url_aqui
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
   ```

### Error "Credenciales inválidas"
- Verifica que el email y contraseña sean exactos (case-sensitive)
- Revisa que el usuario esté confirmado en Supabase Auth

### Error "Usuario no es administrador"
- El usuario existe en Auth pero no en la tabla `administradores`
- Ejecuta nuevamente el script SQL del Paso 2

## 📞 Notas Adicionales

- Si necesitas cambiar la contraseña, puedes hacerlo desde Supabase Dashboard → Authentication → Users
- Para agregar más administradores, usa el panel de administración una vez que hayas iniciado sesión
- El rol `super_admin` tiene acceso completo a todas las funcionalidades

---

**¡Listo!** Tu usuario administrador está configurado y listo para usar. 🎉

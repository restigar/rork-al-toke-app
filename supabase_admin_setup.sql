-- ============================================
-- Script para agregar usuario administrador
-- Email: restigar00@gmail.com
-- Rol: super_admin (propietario)
-- ============================================

-- Insertar administrador propietario
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

-- Verificar que se creó correctamente
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

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Administrador propietario configurado exitosamente';
  RAISE NOTICE 'Email: restigar00@gmail.com';
  RAISE NOTICE 'Rol: super_admin';
  RAISE NOTICE 'Puede iniciar sesión desde la pantalla principal de la aplicación';
END $$;

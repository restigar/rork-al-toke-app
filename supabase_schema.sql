-- ============================================
-- Al Toke App - Configuración Base de Datos
-- Supabase PostgreSQL Schema
-- ============================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla: administradores
-- Almacena información de administradores del sistema
CREATE TABLE IF NOT EXISTS administradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT CHECK (rol IN ('super_admin', 'admin', 'moderador')) DEFAULT 'admin',
  permisos JSONB DEFAULT '{"gestionar_comercios": true, "gestionar_clientes": true, "gestionar_ofertas": true, "gestionar_comisiones": true, "gestionar_admins": false}'::JSONB,
  activo BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: comisiones
-- Almacena configuración de comisiones y planes
CREATE TABLE IF NOT EXISTS comisiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('porcentaje', 'fijo', 'plan')) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descripcion TEXT,
  activa BOOLEAN DEFAULT TRUE,
  aplicable_a TEXT CHECK (aplicable_a IN ('todos', 'comercios', 'clientes')) DEFAULT 'todos',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: auditoria_admin
-- Registra acciones de administradores
CREATE TABLE IF NOT EXISTS auditoria_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES administradores(id) ON DELETE SET NULL,
  accion TEXT NOT NULL,
  entidad_tipo TEXT,
  entidad_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: clientes
-- Almacena información de usuarios clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  numero_cliente TEXT UNIQUE NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: comercios
-- Almacena información de comercios registrados
CREATE TABLE IF NOT EXISTS comercios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  numero_comercio TEXT UNIQUE NOT NULL,
  telefono TEXT,
  tipo TEXT CHECK (tipo IN ('Comercio', 'Servicio', 'Organización Pública')),
  rubro TEXT,
  sub_rubro TEXT,
  foto_perfil TEXT,
  facebook TEXT,
  instagram TEXT,
  website TEXT,
  ubicacion JSONB, -- { latitud, longitud, calle, ciudad }
  horarios JSONB, -- Array de objetos con horarios
  esta_de_turno BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: ofertas
-- Almacena ofertas de comercios
CREATE TABLE IF NOT EXISTS ofertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2),
  vigencia_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  vigencia_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  imagen_url TEXT,
  video_url TEXT,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: ofertas_dia
-- Almacena ofertas del día publicadas por clientes
CREATE TABLE IF NOT EXISTS ofertas_dia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2),
  fecha DATE NOT NULL,
  imagen_url TEXT,
  direccion TEXT,
  numero_contacto TEXT,
  ubicacion JSONB, -- { latitud, longitud, ciudad }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_administradores_email ON administradores(email);
CREATE INDEX IF NOT EXISTS idx_administradores_rol ON administradores(rol);
CREATE INDEX IF NOT EXISTS idx_administradores_activo ON administradores(activo);

CREATE INDEX IF NOT EXISTS idx_comisiones_tipo ON comisiones(tipo);
CREATE INDEX IF NOT EXISTS idx_comisiones_activa ON comisiones(activa);

CREATE INDEX IF NOT EXISTS idx_auditoria_admin_id ON auditoria_admin(admin_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON auditoria_admin(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria_admin(created_at);

CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_numero ON clientes(numero_cliente);

CREATE INDEX IF NOT EXISTS idx_comercios_email ON comercios(email);
CREATE INDEX IF NOT EXISTS idx_comercios_numero ON comercios(numero_comercio);
CREATE INDEX IF NOT EXISTS idx_comercios_rubro ON comercios(rubro);
CREATE INDEX IF NOT EXISTS idx_comercios_ubicacion ON comercios USING GIN(ubicacion);

CREATE INDEX IF NOT EXISTS idx_ofertas_comercio ON ofertas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_vigencia ON ofertas(vigencia_inicio, vigencia_fin);
CREATE INDEX IF NOT EXISTS idx_ofertas_activa ON ofertas(activa);

CREATE INDEX IF NOT EXISTS idx_ofertas_dia_cliente ON ofertas_dia(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ofertas_dia_fecha ON ofertas_dia(fecha);
CREATE INDEX IF NOT EXISTS idx_ofertas_dia_ubicacion ON ofertas_dia USING GIN(ubicacion);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_administradores_updated_at
  BEFORE UPDATE ON administradores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comisiones_updated_at
  BEFORE UPDATE ON comisiones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comercios_updated_at
  BEFORE UPDATE ON comercios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ofertas_updated_at
  BEFORE UPDATE ON ofertas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ofertas_dia_updated_at
  BEFORE UPDATE ON ofertas_dia
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofertas_dia ENABLE ROW LEVEL SECURITY;

-- Políticas para administradores
CREATE POLICY "Admins pueden ver otros admins"
  ON administradores FOR SELECT
  USING (true);

CREATE POLICY "Solo super_admin puede modificar admins"
  ON administradores FOR ALL
  USING (true);

-- Políticas para comisiones
CREATE POLICY "Todos pueden ver comisiones activas"
  ON comisiones FOR SELECT
  USING (activa = true);

CREATE POLICY "Admins pueden gestionar comisiones"
  ON comisiones FOR ALL
  USING (true);

-- Políticas para auditoría
CREATE POLICY "Admins pueden ver auditoría"
  ON auditoria_admin FOR SELECT
  USING (true);

CREATE POLICY "Sistema puede insertar auditoría"
  ON auditoria_admin FOR INSERT
  WITH CHECK (true);

-- Políticas para clientes
-- Los clientes pueden leer y actualizar solo sus propios datos
CREATE POLICY "Clientes pueden ver sus datos"
  ON clientes FOR SELECT
  USING (true); -- Por ahora permitir lectura pública (ajustar con auth)

CREATE POLICY "Clientes pueden insertar"
  ON clientes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clientes pueden actualizar sus datos"
  ON clientes FOR UPDATE
  USING (true); -- Ajustar: auth.uid() = id

-- Políticas para comercios
CREATE POLICY "Comercios son visibles públicamente"
  ON comercios FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Comercios pueden insertar"
  ON comercios FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Comercios pueden actualizar sus datos"
  ON comercios FOR UPDATE
  USING (true); -- Ajustar: auth.uid() = id

-- Políticas para ofertas
CREATE POLICY "Ofertas son públicas"
  ON ofertas FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Comercios pueden crear ofertas"
  ON ofertas FOR INSERT
  WITH CHECK (true); -- Ajustar: existe comercio con auth.uid()

CREATE POLICY "Comercios pueden actualizar sus ofertas"
  ON ofertas FOR UPDATE
  USING (true); -- Ajustar: comercio_id pertenece a auth.uid()

CREATE POLICY "Comercios pueden eliminar sus ofertas"
  ON ofertas FOR DELETE
  USING (true); -- Ajustar: comercio_id pertenece a auth.uid()

-- Políticas para ofertas del día
CREATE POLICY "Ofertas del día son públicas"
  ON ofertas_dia FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Clientes pueden crear ofertas del día"
  ON ofertas_dia FOR INSERT
  WITH CHECK (true); -- Ajustar: cliente_id = auth.uid()

CREATE POLICY "Clientes pueden actualizar sus ofertas del día"
  ON ofertas_dia FOR UPDATE
  USING (true); -- Ajustar: cliente_id = auth.uid()

CREATE POLICY "Clientes pueden eliminar sus ofertas del día"
  ON ofertas_dia FOR DELETE
  USING (true); -- Ajustar: cliente_id = auth.uid()

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para buscar comercios cercanos (requiere PostGIS)
-- Descomentar si se instala PostGIS extension
/*
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION buscar_comercios_cercanos(
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  radio_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  distancia_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    ST_Distance(
      ST_MakePoint(lon, lat)::geography,
      ST_MakePoint(
        (c.ubicacion->>'longitud')::DOUBLE PRECISION,
        (c.ubicacion->>'latitud')::DOUBLE PRECISION
      )::geography
    ) / 1000 AS distancia_km
  FROM comercios c
  WHERE c.ubicacion IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(lon, lat)::geography,
      ST_MakePoint(
        (c.ubicacion->>'longitud')::DOUBLE PRECISION,
        (c.ubicacion->>'latitud')::DOUBLE PRECISION
      )::geography,
      radio_km * 1000
    )
  ORDER BY distancia_km;
END;
$$ LANGUAGE plpgsql;
*/

-- Función para obtener ofertas activas
CREATE OR REPLACE FUNCTION obtener_ofertas_activas()
RETURNS SETOF ofertas AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM ofertas
  WHERE activa = TRUE
    AND vigencia_inicio <= NOW()
    AND vigencia_fin >= NOW()
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar límite de ofertas del día por cliente
CREATE OR REPLACE FUNCTION verificar_limite_ofertas_dia(
  p_cliente_id UUID,
  p_fecha DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  contador INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO contador
  FROM ofertas_dia
  WHERE cliente_id = p_cliente_id
    AND fecha = p_fecha;
  
  RETURN contador < 2; -- Límite de 2 ofertas por día
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Insertar administrador super admin de prueba
INSERT INTO administradores (email, nombre, rol, permisos)
VALUES (
  'admin@altoke.com',
  'Super Admin',
  'super_admin',
  '{"gestionar_comercios": true, "gestionar_clientes": true, "gestionar_ofertas": true, "gestionar_comisiones": true, "gestionar_admins": true}'::JSONB
)
ON CONFLICT (email) DO NOTHING;

-- Insertar comisión de prueba
INSERT INTO comisiones (nombre, tipo, valor, descripcion, aplicable_a)
VALUES 
  ('Comisión Estándar', 'porcentaje', 10.00, 'Comisión del 10% sobre ventas', 'comercios'),
  ('Plan Básico', 'fijo', 5000.00, 'Plan mensual básico', 'comercios'),
  ('Plan Premium', 'fijo', 15000.00, 'Plan mensual premium con beneficios', 'comercios')
ON CONFLICT DO NOTHING;

-- Insertar cliente de prueba
INSERT INTO clientes (email, nombre, numero_cliente)
VALUES 
  ('cliente@test.com', 'Cliente Test', 'CLI-0001')
ON CONFLICT (email) DO NOTHING;

-- Insertar comercio de prueba
INSERT INTO comercios (
  email,
  nombre,
  numero_comercio,
  telefono,
  tipo,
  rubro,
  sub_rubro,
  ubicacion
)
VALUES (
  'comercio@test.com',
  'Comercio Test',
  'COM-0001',
  '+54 9 3756 12-3456',
  'Comercio',
  'Alimentos y Bebidas',
  'Supermercado',
  '{"latitud": -27.3621, "longitud": -55.9008, "calle": "Av. Córdoba 1234", "ciudad": "Posadas"}'::JSONB
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Ofertas activas con información del comercio
CREATE OR REPLACE VIEW vista_ofertas_activas AS
SELECT 
  o.id,
  o.titulo,
  o.descripcion,
  o.precio,
  o.vigencia_inicio,
  o.vigencia_fin,
  o.imagen_url,
  c.id AS comercio_id,
  c.nombre AS comercio_nombre,
  c.rubro AS comercio_rubro,
  c.ubicacion AS comercio_ubicacion
FROM ofertas o
JOIN comercios c ON o.comercio_id = c.id
WHERE o.activa = TRUE
  AND o.vigencia_inicio <= NOW()
  AND o.vigencia_fin >= NOW()
ORDER BY o.created_at DESC;

-- Vista: Ofertas del día activas
CREATE OR REPLACE VIEW vista_ofertas_dia_activas AS
SELECT 
  od.id,
  od.titulo,
  od.descripcion,
  od.precio,
  od.fecha,
  od.imagen_url,
  od.direccion,
  od.numero_contacto,
  od.ubicacion,
  c.nombre AS cliente_nombre
FROM ofertas_dia od
JOIN clientes c ON od.cliente_id = c.id
WHERE od.fecha >= CURRENT_DATE
ORDER BY od.fecha ASC, od.created_at DESC;

-- ============================================
-- PERMISOS
-- ============================================

-- Otorgar permisos de lectura a usuarios anónimos (anon role)
GRANT SELECT ON administradores TO authenticated;
GRANT SELECT ON comisiones TO anon;
GRANT SELECT ON auditoria_admin TO authenticated;
GRANT SELECT ON clientes TO anon;
GRANT SELECT ON comercios TO anon;
GRANT SELECT ON ofertas TO anon;
GRANT SELECT ON ofertas_dia TO anon;
GRANT SELECT ON vista_ofertas_activas TO anon;
GRANT SELECT ON vista_ofertas_dia_activas TO anon;

-- Otorgar permisos de escritura a usuarios autenticados
GRANT INSERT, UPDATE, DELETE ON administradores TO authenticated;
GRANT INSERT, UPDATE, DELETE ON comisiones TO authenticated;
GRANT INSERT ON auditoria_admin TO authenticated;
GRANT INSERT, UPDATE ON clientes TO authenticated;
GRANT INSERT, UPDATE ON comercios TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ofertas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ofertas_dia TO authenticated;

-- ============================================
-- FINALIZACIÓN
-- ============================================

-- Verificar la estructura
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('administradores', 'comisiones', 'auditoria_admin', 'clientes', 'comercios', 'ofertas', 'ofertas_dia')
ORDER BY tablename;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Base de datos configurada exitosamente';
  RAISE NOTICE 'Tablas creadas: administradores, comisiones, auditoria_admin, clientes, comercios, ofertas, ofertas_dia';
  RAISE NOTICE 'Índices, triggers y RLS configurados';
  RAISE NOTICE 'Vistas creadas: vista_ofertas_activas, vista_ofertas_dia_activas';
END $$;

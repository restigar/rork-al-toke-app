-- ============================================================
-- AL TOKE — Migración 2: tablas para config y panel admin
-- Pegar completo en: Supabase Dashboard → SQL Editor → Run
-- (Es re-ejecutable: no borra nada si ya existe)
-- ============================================================

-- ============================================================
-- 1) APP_CONFIG — configuración de versiones (antes Firestore config/version)
--    La app lee: minVersion, recommendedVersion, forceUpdate,
--    updateMessage, storeUrls desde la clave 'version'.
-- ============================================================
create table if not exists public.app_config (
  clave      text primary key,
  valor      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists "app_config_lectura_publica" on public.app_config;
create policy "app_config_lectura_publica"
  on public.app_config for select
  using (true);

insert into public.app_config (clave, valor) values (
  'version',
  '{
    "minVersion": "1.0.0",
    "recommendedVersion": "1.0.0",
    "forceUpdate": false,
    "updateMessage": {
      "es": "Hay una nueva versión disponible con mejoras.",
      "en": "A new version is available with improvements.",
      "pt": "Uma nova versão está disponível.",
      "fr": "Une nouvelle version est disponible."
    },
    "storeUrls": { "ios": "", "android": "" }
  }'::jsonb
) on conflict (clave) do nothing;

-- ============================================================
-- 2) ADMINISTRADORES — registro de admins del panel
--    Cada admin debe existir TAMBIÉN como usuario en
--    Supabase Auth (Authentication → Users → Add user)
--    con el MISMO email que se inserta acá.
-- ============================================================
create table if not exists public.administradores (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  nombre        text not null default 'Administrador',
  rol           text not null default 'admin',
  permisos      jsonb not null default '[]'::jsonb,
  activo        boolean not null default true,
  ultimo_acceso timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.administradores enable row level security;

-- Cada admin solo ve su propia fila (tras iniciar sesión)
drop policy if exists "admin_lee_propio" on public.administradores;
create policy "admin_lee_propio"
  on public.administradores for select
  using (auth.email() = email);

-- Admin inicial (cambiá el email si querés usar otro)
insert into public.administradores (email, nombre)
values ('info@al-toke.com', 'Administrador Al Toke')
on conflict (email) do nothing;

-- ============================================================
-- 3) COMISIONES (antes colección Firestore comisiones)
-- ============================================================
create table if not exists public.comisiones (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        text not null check (tipo in ('porcentaje', 'fijo', 'plan')),
  valor       numeric not null,
  descripcion text,
  aplicable_a text not null default 'todos'
              check (aplicable_a in ('todos', 'comercios', 'clientes')),
  activa      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.comisiones enable row level security;

drop policy if exists "comisiones_admin_leer" on public.comisiones;
create policy "comisiones_admin_leer"
  on public.comisiones for select
  using (
    exists (
      select 1 from public.administradores a
      where a.email = auth.email() and a.activo
    )
  );

drop policy if exists "comisiones_admin_insertar" on public.comisiones;
create policy "comisiones_admin_insertar"
  on public.comisiones for insert
  with check (
    exists (
      select 1 from public.administradores a
      where a.email = auth.email() and a.activo
    )
  );

-- ============================================================
-- 4) AUDITORIA_ADMIN — registro de acciones del panel
-- ============================================================
create table if not exists public.auditoria_admin (
  id               uuid primary key default gen_random_uuid(),
  admin_id         uuid,
  accion           text not null,
  entidad_tipo     text,
  entidad_id       text,
  datos_anteriores jsonb,
  datos_nuevos     jsonb,
  created_at       timestamptz not null default now()
);

alter table public.auditoria_admin enable row level security;

drop policy if exists "auditoria_admin_insertar" on public.auditoria_admin;
create policy "auditoria_admin_insertar"
  on public.auditoria_admin for insert
  with check (
    exists (
      select 1 from public.administradores a
      where a.email = auth.email() and a.activo
    )
  );

-- ============================================================
-- LISTO ✅
-- ============================================================

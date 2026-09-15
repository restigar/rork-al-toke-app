-- ============================================================
-- AL TOKE APP — Esquema para Supabase (PostgreSQL)
-- Pegar completo en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ============================================================
-- 1) SECUENCIAS para números de cliente y comercio
--    Genera: 00001, 00002, 00003...
-- ============================================================
create sequence if not exists public.seq_clientes start 1;
create sequence if not exists public.seq_comercios start 1;

-- ============================================================
-- 2) TABLA COMERCIOS (perfil completo del formulario de registro)
--    Relación 1 a 1 con el usuario de Supabase Auth (auth.users)
-- ============================================================
create table if not exists public.comercios (
  id             uuid primary key references auth.users(id) on delete cascade,
  numero_comercio text unique default 'C' || lpad(nextval('public.seq_comercios')::text, 5, '0'),
  nombre         text not null,
  email          text not null,
  telefono       text,
  tipo           text not null default 'Comercio'
                 check (tipo in ('Comercio', 'Servicio', 'Organización Pública')),
  rubro          text,
  sub_rubro      text,
  foto_perfil    text,
  facebook       text,
  instagram      text,
  website        text,
  calle          text,
  ciudad         text,
  latitud        double precision,
  longitud       double precision,
  horarios       jsonb not null default '[]'::jsonb,
  esta_de_turno  boolean not null default false,
  estado         text not null default 'Activo'
                 check (estado in ('Activo', 'Suspendido', 'Inactivo')),
  acepto_terminos boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- 3) TABLA CLIENTES (datos personales del formulario de registro)
-- ============================================================
create table if not exists public.clientes (
  id             uuid primary key references auth.users(id) on delete cascade,
  numero_cliente text unique default 'CL' || lpad(nextval('public.seq_clientes')::text, 5, '0'),
  nombre         text not null,
  apellido       text not null,
  email          text not null,
  telefono       text,
  ciudad         text,
  fecha_nacimiento date,
  foto_perfil    text,
  estado         text not null default 'Activo'
                 check (estado in ('Activo', 'Suspendido', 'Inactivo')),
  acepto_terminos boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- 4) ÍNDICES para búsquedas de la app
-- ============================================================
create index if not exists idx_comercios_ciudad   on public.comercios (ciudad);
create index if not exists idx_comercios_estado   on public.comercios (estado);
create index if not exists idx_comercios_nombre   on public.comercios using gin (to_tsvector('spanish', nombre));
create index if not exists idx_clientes_email     on public.clientes (email);

-- ============================================================
-- 5) FUNCIÓN updated_at (se actualiza solo al editar)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_comercios_updated
  before update on public.comercios
  for each row execute function public.set_updated_at();

create trigger trg_clientes_updated
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6) TRIGGER DE REGISTRO AUTOMÁTICO
--    Cuando alguien se registra (signUp), crea su fila en
--    clientes o comercios según el campo "type" que envía la app:
--    signUp(email, password, { data: { type: 'cliente'|'comercio', ... } })
-- ============================================================
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.raw_user_meta_data->>'type') = 'comercio' then
    insert into public.comercios (id, nombre, email, telefono, acepto_terminos)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'nombre', 'Sin nombre'),
      new.email,
      new.raw_user_meta_data->>'telefono',
      coalesce((new.raw_user_meta_data->>'aceptoTerminos')::boolean, true)
    )
    on conflict (id) do nothing;
  else
    insert into public.clientes (id, nombre, apellido, email, acepto_terminos)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'nombre', 'Sin nombre'),
      coalesce(new.raw_user_meta_data->>'apellido', ''),
      new.email,
      coalesce((new.raw_user_meta_data->>'aceptoTerminos')::boolean, true)
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();

-- ============================================================
-- 7) ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.clientes  enable row level security;
alter table public.comercios enable row level security;

-- ---------- COMERCIOS ----------
-- Lectura pública: la app necesita mostrar comercios y sus perfiles a los clientes
create policy "comercios_lectura_publica"
  on public.comercios for select
  using (true);

-- Cada comercio solo puede crear su propio perfil
create policy "comercios_insertar_propio"
  on public.comercios for insert
  with check (auth.uid() = id);

-- Cada comercio solo puede editar su propio perfil
create policy "comercios_actualizar_propio"
  on public.comercios for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- El borrado pasa por el panel admin (service role), sin policy pública

-- ---------- CLIENTES ----------
-- Datos personales: cada cliente ve y edita SOLO su propio perfil
create policy "clientes_leer_propio"
  on public.clientes for select
  using (auth.uid() = id);

create policy "clientes_insertar_propio"
  on public.clientes for insert
  with check (auth.uid() = id);

create policy "clientes_actualizar_propio"
  on public.clientes for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- LISTO ✅
-- Las tablas quedan conectadas a Supabase Auth: el id de cada
-- fila es el mismo uid del usuario logueado, y RLS garantiza
-- que cada usuario solo toque su propio perfil.
-- ============================================================

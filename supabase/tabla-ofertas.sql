-- ============================================================
-- AL TOKE APP — Tablas de OFERTAS (compartidas entre dispositivos)
-- Pegar completo en: Supabase Dashboard → SQL Editor → Run
--
-- Crea:
--   1) public.ofertas         (ofertas de comercios)
--   2) public.ofertas_del_dia (ofertas del día de clientes)
--   3) bucket público "ofertas-public" para fotos/videos de ofertas
-- ============================================================

-- ============================================================
-- 1) TABLA OFERTAS (comercios)
-- ============================================================
create table if not exists public.ofertas (
  id              text primary key,
  comercio_id     uuid not null references auth.users(id) on delete cascade,
  comercio_nombre text not null default '',
  titulo          text not null,
  descripcion     text not null default '',
  precio          numeric not null default 0,
  vigencia_inicio timestamptz not null default now(),
  vigencia_fin    timestamptz not null default now(),
  imagen_url      text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 2) TABLA OFERTAS_DEL_DIA (clientes)
-- ============================================================
create table if not exists public.ofertas_del_dia (
  id              text primary key,
  cliente_id      uuid not null references auth.users(id) on delete cascade,
  cliente_nombre  text not null default '',
  titulo          text not null,
  descripcion     text not null default '',
  precio          numeric not null default 0,
  fecha           timestamptz not null default now(),
  imagen_url      text,
  direccion       text,
  numero_contacto text,
  ubicacion       jsonb,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- 3) ÍNDICES
-- ============================================================
create index if not exists idx_ofertas_comercio    on public.ofertas (comercio_id);
create index if not exists idx_ofertas_vigencia    on public.ofertas (vigencia_fin);
create index if not exists idx_ofertas_dia_cliente on public.ofertas_del_dia (cliente_id);
create index if not exists idx_ofertas_dia_fecha   on public.ofertas_del_dia (fecha);

-- ============================================================
-- 4) ROW LEVEL SECURITY
--    Lectura pública (todos los celulares ven las ofertas)
--    Escritura solo del dueño
-- ============================================================
alter table public.ofertas         enable row level security;
alter table public.ofertas_del_dia enable row level security;

-- ---------- OFERTAS (comercios) ----------
create policy "ofertas_lectura_publica"
  on public.ofertas for select
  using (true);

create policy "ofertas_insertar_propia"
  on public.ofertas for insert
  with check (auth.uid() = comercio_id);

create policy "ofertas_actualizar_propia"
  on public.ofertas for update
  using (auth.uid() = comercio_id)
  with check (auth.uid() = comercio_id);

create policy "ofertas_borrar_propia"
  on public.ofertas for delete
  using (auth.uid() = comercio_id);

-- ---------- OFERTAS_DEL_DIA (clientes) ----------
create policy "ofertas_dia_lectura_publica"
  on public.ofertas_del_dia for select
  using (true);

create policy "ofertas_dia_insertar_propia"
  on public.ofertas_del_dia for insert
  with check (auth.uid() = cliente_id);

create policy "ofertas_dia_actualizar_propia"
  on public.ofertas_del_dia for update
  using (auth.uid() = cliente_id)
  with check (auth.uid() = cliente_id);

create policy "ofertas_dia_borrar_propia"
  on public.ofertas_del_dia for delete
  using (auth.uid() = cliente_id);

-- ============================================================
-- 5) BUCKET PÚBLICO para las fotos/videos de las ofertas
--    Ruta dentro del bucket: ofertas/<uid>/<archivo>
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ofertas-public', 'ofertas-public', true)
on conflict (id) do update set public = true;

create policy "ofertas_media_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'ofertas-public');

create policy "ofertas_media_subir_propia"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ofertas-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ofertas_media_actualizar_propia"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ofertas-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'ofertas-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ofertas_media_borrar_propia"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ofertas-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- LISTO ✅
-- Las ofertas ahora se guardan en Supabase: lo que publica un
-- celular lo ve cualquier otro celular. El bucket es público
-- solo para lectura; cada usuario solo puede subir/borrar sus
-- propios archivos (carpeta ofertas/<su-uid>/).
-- ============================================================

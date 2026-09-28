-- ============================================================
-- AL TOKE APP — Sistema de archivos (user_uploads + Storage)
-- Pegar completo en: Supabase Dashboard → SQL Editor → Run
--
-- Buckets:
--   clientes-private (privado): cada cliente ve SOLO sus archivos
--   comercios-public (público): el dueño sube/gestiona, cualquier
--                               cliente autenticado puede ver
-- ============================================================

-- ============================================================
-- 1) TABLA public.user_uploads (metadatos de cada archivo)
-- ============================================================
create table if not exists public.user_uploads (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  owner_role text not null check (owner_role in ('cliente', 'comercio')),
  tipo       text not null check (tipo in ('imagen', 'video')),
  url_path   text not null,
  mime_type  text,
  is_public  boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_uploads_owner  on public.user_uploads (owner_id, created_at desc);
create index if not exists idx_user_uploads_public on public.user_uploads (owner_role, is_public);

-- ============================================================
-- 2) RLS EN user_uploads
-- ============================================================
alter table public.user_uploads enable row level security;

-- Cada dueño ve sus propios archivos (cliente o comercio)
create policy "uploads_select_propio"
  on public.user_uploads for select to authenticated
  using (auth.uid() = owner_id);

-- Lectura de archivos de comercios o marcados públicos (para clientes en la app)
create policy "uploads_select_publicos"
  on public.user_uploads for select to authenticated
  using (owner_role = 'comercio' or is_public = true);

-- Insertar solo propios, y la ruta debe corresponder al rol:
--   cliente  → clientes/<uid>/...
--   comercio → comercios/<uid>/...
create policy "uploads_insertar_propio"
  on public.user_uploads for insert to authenticated
  with check (
    auth.uid() = owner_id
    and (
      (owner_role = 'cliente'  and url_path like 'clientes/'  || auth.uid()::text || '/%')
      or
      (owner_role = 'comercio' and url_path like 'comercios/' || auth.uid()::text || '/%')
    )
  );

-- Actualizar solo propios (título, is_public, etc.)
create policy "uploads_actualizar_propio"
  on public.user_uploads for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Borrar solo propios
create policy "uploads_borrar_propio"
  on public.user_uploads for delete to authenticated
  using (auth.uid() = owner_id);

-- ============================================================
-- 3) BUCKETS DE STORAGE
-- ============================================================
insert into storage.buckets (id, name, public)
values ('clientes-private', 'clientes-private', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('comercios-public', 'comercios-public', true)
on conflict (id) do nothing;

-- ============================================================
-- 4) POLÍTICAS DE STORAGE
--    Regla de carpeta: la primera carpeta del path debe ser el
--    uid del usuario → nadie puede tocar archivos ajenos.
-- ============================================================

-- ---------- BUCKET PRIVADO: clientes-private ----------
drop policy if exists "clientes_private_select"  on storage.objects;
drop policy if exists "clientes_private_insert"  on storage.objects;
drop policy if exists "clientes_private_update"  on storage.objects;
drop policy if exists "clientes_private_delete"  on storage.objects;

-- Solo el dueño puede leer (necesario también para crear URLs firmadas)
create policy "clientes_private_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'clientes-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Solo el dueño puede subir, dentro de su carpeta
create policy "clientes_private_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'clientes-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "clientes_private_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'clientes-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'clientes-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "clientes_private_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'clientes-private'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- BUCKET PÚBLICO: comercios-public ----------
drop policy if exists "comercios_public_select" on storage.objects;
drop policy if exists "comercios_public_insert" on storage.objects;
drop policy if exists "comercios_public_update" on storage.objects;
drop policy if exists "comercios_public_delete" on storage.objects;

-- Lectura por cualquiera (los clientes ven las fotos/videos de los comercios)
create policy "comercios_public_select"
  on storage.objects for select
  using (bucket_id = 'comercios-public');

-- Solo el comercio dueño sube, dentro de comercios/<su-uid>/
create policy "comercios_public_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'comercios-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "comercios_public_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'comercios-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'comercios-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "comercios_public_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'comercios-public'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- LISTO ✅
--   clientes-private → acceso estricto a auth.uid() = dueño
--   comercios-public → lectura pública, escritura solo del dueño
-- ============================================================

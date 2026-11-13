-- Initial Supabase schema for RESA's marketplace backend.
-- Apply with `supabase db push` after linking this repository to a Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  role text not null default 'SEEKER' check (role in ('SEEKER', 'OWNER', 'AGENT', 'ADMIN')),
  verification_status text not null default 'UNVERIFIED'
    check (verification_status in ('UNVERIFIED', 'PENDING', 'VERIFIED', 'SUSPENDED')),
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id text primary key,
  owner_id uuid not null references public.profiles (id),
  authorized_agent_id uuid references public.profiles (id),
  listing_status text not null default 'DRAFT',
  title text not null,
  city text not null default '',
  area text not null default '',
  address text not null default '',
  property_type text not null default '',
  listing_type text not null default '',
  price numeric(16, 2) not null default 0 check (price >= 0),
  latitude double precision,
  longitude double precision,
  property_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint properties_coordinates_pair check (
    (latitude is null and longitude is null) or
    (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create index if not exists properties_public_search_idx
  on public.properties (listing_status, city, property_type, listing_type, price);
create index if not exists properties_owner_idx on public.properties (owner_id, updated_at desc);
create index if not exists properties_geo_idx on public.properties (latitude, longitude)
  where latitude is not null and longitude is not null;

create table if not exists public.property_media (
  id text primary key,
  property_id text not null references public.properties (id) on delete cascade,
  media_data jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_agent_relationships (
  id text primary key,
  owner_id uuid not null references public.profiles (id),
  agent_id uuid not null references public.profiles (id),
  created_by uuid not null references public.profiles (id),
  invited_by text not null check (invited_by in ('OWNER', 'AGENT')),
  status text not null default 'INVITED',
  relationship_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationship_participants_differ check (owner_id <> agent_id),
  constraint relationship_inviter_is_participant check (
    (invited_by = 'OWNER' and created_by = owner_id) or
    (invited_by = 'AGENT' and created_by = agent_id)
  )
);

create table if not exists public.property_enquiries (
  id text primary key,
  property_id text not null references public.properties (id),
  seeker_id uuid not null references public.profiles (id),
  host_id uuid not null references public.profiles (id),
  enquiry_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_applications (
  id text primary key,
  property_id text not null references public.properties (id),
  seeker_id uuid not null references public.profiles (id),
  application_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := upper(coalesce(new.raw_user_meta_data ->> 'role', 'SEEKER'));
begin
  if requested_role not in ('SEEKER', 'OWNER', 'AGENT') then
    requested_role := 'SEEKER';
  end if;

  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    requested_role
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_media enable row level security;
alter table public.owner_agent_relationships enable row level security;
alter table public.property_enquiries enable row level security;
alter table public.property_applications enable row level security;

-- Profiles are private by default. Users may read their own profile; role and
-- verification fields are intentionally not client-updatable.
drop policy if exists "profile owners read own profile" on public.profiles;
create policy "profile owners read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, profile_data, updated_at) on public.profiles to authenticated;
drop policy if exists "profile owners update safe fields" on public.profiles;
create policy "profile owners update safe fields" on public.profiles
  for update to authenticated using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "public can read active listings" on public.properties;
create policy "public can read active listings" on public.properties
  for select to anon, authenticated using (listing_status in ('VERIFIED', 'ACTIVE', 'RESERVED', 'OCCUPIED', 'SOLD'));
drop policy if exists "owners and agents can read own listings" on public.properties;
create policy "owners and agents can read own listings" on public.properties
  for select to authenticated using (
    owner_id = (select auth.uid()) or authorized_agent_id = (select auth.uid())
  );
drop policy if exists "owners can create drafts" on public.properties;
create policy "owners can create drafts" on public.properties
  for insert to authenticated with check (
    owner_id = (select auth.uid()) and listing_status = 'DRAFT'
  );
drop policy if exists "owners can edit drafts" on public.properties;
create policy "owners can edit drafts" on public.properties
  for update to authenticated using (
    owner_id = (select auth.uid()) and listing_status in ('DRAFT', 'CHANGES_REQUIRED')
  ) with check (
    owner_id = (select auth.uid()) and listing_status in ('DRAFT', 'CHANGES_REQUIRED')
  );
grant select on public.properties to anon, authenticated;
grant insert (
  id, owner_id, title, city, area, address, property_type, listing_type,
  price, latitude, longitude, property_data
) on public.properties to authenticated;
grant update (
  title, city, area, address, property_type, listing_type, price,
  latitude, longitude, property_data, updated_at
) on public.properties to authenticated;

drop policy if exists "media follows listing visibility" on public.property_media;
create policy "media follows listing visibility" on public.property_media
  for select to anon, authenticated using (exists (
    select 1 from public.properties p where p.id = property_id and (
      p.listing_status in ('VERIFIED', 'ACTIVE', 'RESERVED', 'OCCUPIED', 'SOLD') or
      p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid())
    )
  ));
grant select on public.property_media to anon, authenticated;

drop policy if exists "relationship participants read" on public.owner_agent_relationships;
create policy "relationship participants read" on public.owner_agent_relationships
  for select to authenticated using (
    owner_id = (select auth.uid()) or agent_id = (select auth.uid())
  );
drop policy if exists "participants create relationship invitations" on public.owner_agent_relationships;
create policy "participants create relationship invitations" on public.owner_agent_relationships
  for insert to authenticated with check (
    created_by = (select auth.uid()) and status = 'INVITED'
  );
grant select, insert on public.owner_agent_relationships to authenticated;

drop policy if exists "enquiry participants read" on public.property_enquiries;
create policy "enquiry participants read" on public.property_enquiries
  for select to authenticated using (
    seeker_id = (select auth.uid()) or host_id = (select auth.uid())
  );
drop policy if exists "seekers create enquiries" on public.property_enquiries;
create policy "seekers create enquiries" on public.property_enquiries
  for insert to authenticated with check (
    seeker_id = (select auth.uid()) and exists (
      select 1 from public.properties p where p.id = property_id
        and p.listing_status in ('VERIFIED', 'ACTIVE', 'RESERVED', 'OCCUPIED', 'SOLD')
        and host_id = coalesce(p.authorized_agent_id, p.owner_id)
    ) and exists (
      select 1 from public.profiles u where u.id = seeker_id and u.role = 'SEEKER'
    )
  );
grant select, insert on public.property_enquiries to authenticated;

drop policy if exists "application participants read" on public.property_applications;
create policy "application participants read" on public.property_applications
  for select to authenticated using (
    seeker_id = (select auth.uid()) or exists (
      select 1 from public.properties p where p.id = property_id and (
        p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid())
      )
    )
  );
drop policy if exists "seekers create applications" on public.property_applications;
create policy "seekers create applications" on public.property_applications
  for insert to authenticated with check (
    seeker_id = (select auth.uid()) and exists (
      select 1 from public.properties p where p.id = property_id
        and p.listing_status in ('VERIFIED', 'ACTIVE')
    ) and exists (
      select 1 from public.profiles u where u.id = seeker_id and u.role = 'SEEKER'
    )
  );
grant select, insert on public.property_applications to authenticated;

revoke all on public.owner_agent_relationships from anon;
revoke all on public.property_enquiries from anon;
revoke all on public.property_applications from anon;

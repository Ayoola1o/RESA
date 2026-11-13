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

-- Role-specific profiles
create table if not exists public.seeker_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  portfolio_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  agency_name text,
  license_number text,
  verification_level text not null default 'LEVEL_0_UNVERIFIED'
    check (verification_level in (
      'LEVEL_0_UNVERIFIED', 'LEVEL_1_IDENTITY_VERIFIED',
      'LEVEL_2_BUSINESS_REGISTERED', 'LEVEL_3_LICENSED_PRACTITIONER'
    )),
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seeker account data
create table if not exists public.seeker_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.seeker_saved_properties (
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id text not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);
create index if not exists seeker_saved_properties_property_idx
  on public.seeker_saved_properties (property_id);

-- Agent credentials and staff governance
create table if not exists public.agent_credentials (
  id text primary key,
  agent_id uuid not null references public.profiles (id) on delete cascade,
  level text not null default 'LEVEL_0_UNVERIFIED'
    check (level in (
      'LEVEL_0_UNVERIFIED', 'LEVEL_1_IDENTITY_VERIFIED',
      'LEVEL_2_BUSINESS_REGISTERED', 'LEVEL_3_LICENSED_PRACTITIONER'
    )),
  credential_type text not null check (credential_type in (
    'GOVERNMENT_ID', 'CAC_CERTIFICATE', 'ASSOCIATION_REGISTRATION', 'STATE_LICENSE', 'OTHER'
  )),
  title text not null,
  issuing_authority text not null,
  registration_number text not null,
  file_reference text,
  document_url text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED')),
  issued_at timestamptz,
  expires_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);
create index if not exists agent_credentials_agent_idx
  on public.agent_credentials (agent_id, created_at desc);

create table if not exists public.staff_accounts (
  id text primary key,
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  email text not null,
  name text not null,
  roles text[] not null default '{}',
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
  scope jsonb not null default '{"scopeType":"GLOBAL"}'::jsonb,
  delegation jsonb,
  custom_grants jsonb not null default '[]'::jsonb,
  invited_by uuid references public.profiles (id),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id text primary key,
  action_type text not null check (action_type in (
    'PROPERTY_RESTORE', 'USER_SUSPENSION', 'PRIVILEGED_STAFF_ROLE_CHANGE',
    'PLATFORM_SETTINGS_CHANGE', 'EMERGENCY_OVERRIDE'
  )),
  target_resource_type text not null check (target_resource_type in ('PROPERTY', 'USER', 'STAFF', 'SETTINGS')),
  target_resource_id text not null,
  requester_staff_id text not null references public.staff_accounts (id),
  requester_user_id uuid not null references public.profiles (id),
  requester_email text not null,
  proposed_payload jsonb not null,
  initial_snapshot jsonb,
  reason text not null,
  supporting_evidence text,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'EXECUTED')),
  approver_staff_id text references public.staff_accounts (id),
  approver_email text,
  decision_notes text,
  decided_at timestamptz,
  executed_at timestamptz,
  execution_result text check (execution_result in ('SUCCESS', 'FAILURE')),
  execution_error text,
  is_emergency boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists approval_requests_queue_idx
  on public.approval_requests (status, expires_at, created_at desc);

-- Owner, agent, and seeker workflows
create table if not exists public.inspection_requests (
  id text primary key,
  property_id text not null references public.properties (id),
  seeker_id uuid not null references public.profiles (id),
  host_id uuid not null references public.profiles (id),
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW')),
  preferred_date date not null,
  preferred_time_slot text not null,
  inspection_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists inspection_requests_seeker_idx
  on public.inspection_requests (seeker_id, created_at desc);
create index if not exists inspection_requests_host_idx
  on public.inspection_requests (host_id, preferred_date);

create table if not exists public.enquiry_messages (
  id text primary key,
  enquiry_id text not null references public.property_enquiries (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  sender_role text not null check (sender_role in ('SEEKER', 'OWNER', 'AGENT', 'ADMIN')),
  body text not null,
  warning_notice text,
  has_off_platform_warning boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists enquiry_messages_thread_idx
  on public.enquiry_messages (enquiry_id, created_at);

create table if not exists public.listing_reports (
  id text primary key,
  property_id text not null references public.properties (id),
  reporter_id uuid not null references public.profiles (id),
  reason text not null,
  description text not null,
  status text not null default 'REPORTED'
    check (status in (
      'REPORTED', 'UNDER_INVESTIGATION', 'DOCUMENTATION_REQUESTED',
      'RESOLVED', 'DISMISSED', 'SUSPENDED', 'ESCALATED'
    )),
  resolution_data jsonb not null default '{}'::jsonb,
  reported_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id)
);
create index if not exists listing_reports_queue_idx
  on public.listing_reports (status, reported_at desc);

create table if not exists public.notifications (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_type text not null check (notification_type in (
    'ENQUIRY', 'INSPECTION', 'APPLICATION', 'VERIFICATION', 'REPORT', 'SYSTEM'
  )),
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

-- Admin review queues and confidential documents
create table if not exists public.property_verifications (
  property_id text primary key references public.properties (id) on delete cascade,
  verification_id text not null unique,
  reviewer_id uuid references public.profiles (id),
  owner_identity_status text not null default 'PENDING'
    check (owner_identity_status in ('PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED', 'NOT_REVIEWED')),
  location_status text not null default 'PENDING'
    check (location_status in ('PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED', 'NOT_REVIEWED')),
  authority_document_status text not null default 'PENDING'
    check (authority_document_status in ('PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED', 'NOT_REVIEWED')),
  availability_status text not null default 'PENDING'
    check (availability_status in ('PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED', 'NOT_REVIEWED')),
  media_status text not null default 'PENDING'
    check (media_status in ('PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED', 'NOT_REVIEWED')),
  inspection_status text not null default 'PENDING'
    check (inspection_status in ('PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED', 'NOT_REVIEWED')),
  overall_status text not null default 'PENDING'
    check (overall_status in ('PENDING', 'IN_REVIEW', 'PASSED', 'FAILED', 'CHANGES_REQUIRED')),
  review_notes text,
  reviewed_at timestamptz,
  last_verified_at timestamptz,
  trust_disclaimer text,
  updated_at timestamptz not null default now()
);

create table if not exists public.property_documents (
  id text primary key,
  property_id text not null references public.properties (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id),
  document_type text not null,
  file_name text not null,
  file_reference text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUIRED')),
  review_data jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);
create index if not exists property_documents_property_idx
  on public.property_documents (property_id, uploaded_at desc);

create table if not exists public.user_documents (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_type text not null,
  title text not null,
  file_name text not null,
  file_reference text not null,
  file_size bigint not null check (file_size >= 0),
  mime_type text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
  review_data jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);
create index if not exists user_documents_user_idx
  on public.user_documents (user_id, uploaded_at desc);

create table if not exists public.audit_logs (
  id text primary key,
  actor_id uuid references public.profiles (id),
  action text not null,
  object_type text not null,
  object_id text not null,
  result text not null check (result in ('SUCCESS', 'FAILURE')),
  occurred_at timestamptz not null default now(),
  previous_checksum text not null,
  checksum text not null,
  audit_data jsonb not null default '{}'::jsonb
);
create index if not exists audit_logs_occurred_idx on public.audit_logs (occurred_at desc);
create index if not exists audit_logs_object_idx on public.audit_logs (object_type, object_id, occurred_at desc);

-- Internal role checks used by RLS. Keep this schema out of the API's exposed schemas.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.has_role(requested_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = requested_role
      and verification_status <> 'SUSPENDED'
  );
$$;

create or replace function private.user_has_role(target_user_id uuid, requested_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = target_user_id and role = requested_role
      and verification_status <> 'SUSPENDED'
  );
$$;

revoke all on function private.has_role(text) from public, anon;
revoke all on function private.user_has_role(uuid, text) from public, anon;
grant execute on function private.has_role(text) to authenticated;
grant execute on function private.user_has_role(uuid, text) to authenticated;

-- Supabase Auth creates the shared profile plus exactly one role profile.
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

  if requested_role = 'SEEKER' then
    insert into public.seeker_profiles (user_id) values (new.id);
  elsif requested_role = 'OWNER' then
    insert into public.owner_profiles (user_id) values (new.id);
  elsif requested_role = 'AGENT' then
    insert into public.agent_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- RLS is enabled for every role and workflow table.
alter table public.seeker_profiles enable row level security;
alter table public.owner_profiles enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.seeker_preferences enable row level security;
alter table public.seeker_saved_properties enable row level security;
alter table public.agent_credentials enable row level security;
alter table public.staff_accounts enable row level security;
alter table public.approval_requests enable row level security;
alter table public.inspection_requests enable row level security;
alter table public.enquiry_messages enable row level security;
alter table public.listing_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.property_verifications enable row level security;
alter table public.property_documents enable row level security;
alter table public.user_documents enable row level security;
alter table public.audit_logs enable row level security;

-- Remove implicit privileges and grant only each role's required operations.
revoke all on public.seeker_profiles, public.owner_profiles, public.agent_profiles,
  public.seeker_preferences, public.seeker_saved_properties, public.agent_credentials,
  public.staff_accounts, public.approval_requests, public.inspection_requests,
  public.enquiry_messages, public.listing_reports, public.notifications,
  public.property_verifications, public.property_documents, public.user_documents,
  public.audit_logs from anon, authenticated;

grant select, insert, update on public.seeker_profiles, public.seeker_preferences,
  public.owner_profiles, public.agent_profiles to authenticated;
grant select, insert, delete on public.seeker_saved_properties to authenticated;
grant select, insert, update on public.staff_accounts to authenticated;
grant select on public.approval_requests, public.audit_logs, public.property_verifications to authenticated;
grant select, insert on public.inspection_requests, public.enquiry_messages,
  public.listing_reports, public.user_documents, public.property_documents to authenticated;
grant select, update (read_at) on public.enquiry_messages to authenticated;
grant select, update (is_read) on public.notifications to authenticated;
grant select, insert on public.agent_credentials to authenticated;
grant update (status, reviewed_by, reviewed_at, review_notes) on public.agent_credentials to authenticated;
grant update (status, review_data) on public.property_documents to authenticated;
grant update (status, review_data) on public.user_documents to authenticated;
grant update (status, resolution_data, resolved_at, resolved_by) on public.listing_reports to authenticated;
grant update (status, decision_notes, approver_staff_id, approver_email, decided_at,
  executed_at, execution_result, execution_error) on public.approval_requests to authenticated;
grant update (reviewer_id, owner_identity_status, location_status, authority_document_status,
  availability_status, media_status, inspection_status, overall_status, review_notes,
  reviewed_at, last_verified_at, trust_disclaimer, updated_at) on public.property_verifications to authenticated;

-- Seekers
drop policy if exists "seekers manage own role profile" on public.seeker_profiles;
create policy "seekers manage own role profile" on public.seeker_profiles
  for all to authenticated using (user_id = (select auth.uid()) and (select private.has_role('SEEKER')))
  with check (user_id = (select auth.uid()) and (select private.has_role('SEEKER')));
drop policy if exists "seekers manage own preferences" on public.seeker_preferences;
create policy "seekers manage own preferences" on public.seeker_preferences
  for all to authenticated using (user_id = (select auth.uid()) and (select private.has_role('SEEKER')))
  with check (user_id = (select auth.uid()) and (select private.has_role('SEEKER')));
drop policy if exists "seekers manage own saved properties" on public.seeker_saved_properties;
create policy "seekers manage own saved properties" on public.seeker_saved_properties
  for all to authenticated using (user_id = (select auth.uid()) and (select private.has_role('SEEKER')))
  with check (user_id = (select auth.uid()) and (select private.has_role('SEEKER')));

-- Owners and landlords
drop policy if exists "owners manage own role profile" on public.owner_profiles;
create policy "owners manage own role profile" on public.owner_profiles
  for all to authenticated using (user_id = (select auth.uid()) and (select private.has_role('OWNER')))
  with check (user_id = (select auth.uid()) and (select private.has_role('OWNER')));

-- Agents
drop policy if exists "agents manage own role profile" on public.agent_profiles;
create policy "agents manage own role profile" on public.agent_profiles
  for all to authenticated using (user_id = (select auth.uid()) and (select private.has_role('AGENT')))
  with check (user_id = (select auth.uid()) and (select private.has_role('AGENT')));
drop policy if exists "agents read own credentials" on public.agent_credentials;
create policy "agents read own credentials" on public.agent_credentials
  for select to authenticated using (agent_id = (select auth.uid()) and (select private.has_role('AGENT')));
drop policy if exists "agents submit own credentials" on public.agent_credentials;
create policy "agents submit own credentials" on public.agent_credentials
  for insert to authenticated with check (
    agent_id = (select auth.uid()) and status = 'PENDING' and (select private.has_role('AGENT'))
  );

-- Admin/staff account data stays private to that staff member and admins.
drop policy if exists "staff read own account or admin manages staff" on public.staff_accounts;
create policy "staff read own account or admin manages staff" on public.staff_accounts
  for select to authenticated using (user_id = (select auth.uid()) or (select private.has_role('ADMIN')));
drop policy if exists "admins manage staff accounts" on public.staff_accounts;
create policy "admins manage staff accounts" on public.staff_accounts
  for all to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));
drop policy if exists "admins read approval queue" on public.approval_requests;
create policy "admins read approval queue" on public.approval_requests
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins update approval queue" on public.approval_requests;
create policy "admins update approval queue" on public.approval_requests
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));
drop policy if exists "admins read audit ledger" on public.audit_logs;
create policy "admins read audit ledger" on public.audit_logs
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins review property verification" on public.property_verifications;
create policy "admins review property verification" on public.property_verifications
  for all to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));

-- Inspection access is shared by its seeker and the assigned host (owner/agent).
drop policy if exists "inspection participants read" on public.inspection_requests;
create policy "inspection participants read" on public.inspection_requests
  for select to authenticated using (
    seeker_id = (select auth.uid()) or host_id = (select auth.uid()) or (select private.has_role('ADMIN'))
  );
drop policy if exists "seekers request inspections" on public.inspection_requests;
create policy "seekers request inspections" on public.inspection_requests
  for insert to authenticated with check (
    seeker_id = (select auth.uid()) and (select private.has_role('SEEKER')) and exists (
      select 1 from public.properties p where p.id = property_id
        and p.listing_status in ('VERIFIED', 'ACTIVE', 'RESERVED')
        and host_id = coalesce(p.authorized_agent_id, p.owner_id)
    )
  );

-- Enquiry messages inherit access from their parent conversation.
drop policy if exists "enquiry participants read messages" on public.enquiry_messages;
create policy "enquiry participants read messages" on public.enquiry_messages
  for select to authenticated using (exists (
    select 1 from public.property_enquiries e where e.id = enquiry_id
      and (e.seeker_id = (select auth.uid()) or e.host_id = (select auth.uid()))
  ));
drop policy if exists "participants send enquiry messages" on public.enquiry_messages;
create policy "participants send enquiry messages" on public.enquiry_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and exists (
      select 1 from public.property_enquiries e where e.id = enquiry_id
        and (e.seeker_id = (select auth.uid()) or e.host_id = (select auth.uid()))
    )
  );
drop policy if exists "participants mark received messages read" on public.enquiry_messages;
create policy "participants mark received messages read" on public.enquiry_messages
  for update to authenticated using (exists (
    select 1 from public.property_enquiries e where e.id = enquiry_id
      and (e.seeker_id = (select auth.uid()) or e.host_id = (select auth.uid()))
      and sender_id <> (select auth.uid())
  )) with check (read_at is not null);

-- Seekers file reports and read their own reports; admin staff manage cases.
drop policy if exists "reporters create reports" on public.listing_reports;
create policy "reporters create reports" on public.listing_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
drop policy if exists "reporters and admins read reports" on public.listing_reports;
create policy "reporters and admins read reports" on public.listing_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or (select private.has_role('ADMIN')));
drop policy if exists "admins update report cases" on public.listing_reports;
create policy "admins update report cases" on public.listing_reports
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));

-- Users read and acknowledge only their own notifications. Inserts are server-side.
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "users mark own notifications read" on public.notifications;
create policy "users mark own notifications read" on public.notifications
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Confidential user and property documents are never public.
drop policy if exists "users and admins read user documents" on public.user_documents;
create policy "users and admins read user documents" on public.user_documents
  for select to authenticated using (user_id = (select auth.uid()) or (select private.has_role('ADMIN')));
drop policy if exists "users upload own documents" on public.user_documents;
create policy "users upload own documents" on public.user_documents
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "admins review user documents" on public.user_documents;
create policy "admins review user documents" on public.user_documents
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));

drop policy if exists "property stakeholders read property documents" on public.property_documents;
create policy "property stakeholders read property documents" on public.property_documents
  for select to authenticated using (
    (select private.has_role('ADMIN')) or exists (
      select 1 from public.properties p where p.id = property_id
        and (p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid()))
    )
  );
drop policy if exists "owners and agents upload property documents" on public.property_documents;
create policy "owners and agents upload property documents" on public.property_documents
  for insert to authenticated with check (
    uploaded_by = (select auth.uid()) and exists (
      select 1 from public.properties p where p.id = property_id
        and (p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid()))
    )
  );
drop policy if exists "admins review property documents" on public.property_documents;
create policy "admins review property documents" on public.property_documents
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));

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
      and (select private.has_role('OWNER'))
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

-- Reinforce role boundaries for client writes and give admin dashboards their
-- required read access. Review and identity fields remain server/admin managed.
revoke update on public.notifications from authenticated;
revoke insert on public.inspection_requests, public.enquiry_messages,
  public.listing_reports, public.user_documents, public.property_documents,
  public.agent_credentials from authenticated;
revoke update on public.agent_profiles from authenticated;
grant update (agency_name, license_number, profile_data, updated_at)
  on public.agent_profiles to authenticated;
grant insert (id, agent_id, credential_type, title, issuing_authority,
  registration_number, file_reference, document_url, issued_at, expires_at)
  on public.agent_credentials to authenticated;
grant insert (id, property_id, seeker_id, host_id, preferred_date,
  preferred_time_slot, inspection_data) on public.inspection_requests to authenticated;
grant insert (id, enquiry_id, sender_id, sender_role, body, warning_notice,
  has_off_platform_warning) on public.enquiry_messages to authenticated;
grant insert (id, property_id, reporter_id, reason, description)
  on public.listing_reports to authenticated;
grant insert (id, user_id, document_type, title, file_name, file_reference,
  file_size, mime_type) on public.user_documents to authenticated;
grant insert (id, property_id, uploaded_by, document_type, file_name,
  file_reference, mime_type, size_bytes) on public.property_documents to authenticated;
grant update (is_read) on public.notifications to authenticated;
grant insert on public.approval_requests to authenticated;
revoke insert on public.approval_requests from authenticated;
grant insert (id, action_type, target_resource_type, target_resource_id,
  requester_staff_id, requester_user_id, requester_email, proposed_payload,
  initial_snapshot, reason, supporting_evidence, expires_at)
  on public.approval_requests to authenticated;
grant update (status, preferred_date, preferred_time_slot, inspection_data, updated_at)
  on public.inspection_requests to authenticated;
grant update (application_data, updated_at) on public.property_applications to authenticated;
grant update (status, relationship_data, updated_at) on public.owner_agent_relationships to authenticated;

-- Keep private verification material out of public listing JSON. It belongs in
-- property_documents and property_verifications, which have separate RLS.
alter table public.properties drop constraint if exists properties_no_private_review_data;
alter table public.properties add constraint properties_no_private_review_data
  check (not (property_data ? 'documents') and not (property_data ? 'verification'));

drop policy if exists "owners manage relationship invitations" on public.owner_agent_relationships;
create policy "owners manage relationship invitations" on public.owner_agent_relationships
  for insert to authenticated with check (
    created_by = (select auth.uid()) and status = 'INVITED'
    and ((invited_by = 'OWNER' and owner_id = (select auth.uid())
        and (select private.has_role('OWNER')) and (select private.user_has_role(agent_id, 'AGENT')))
      or (invited_by = 'AGENT' and agent_id = (select auth.uid())
        and (select private.has_role('AGENT')) and (select private.user_has_role(owner_id, 'OWNER'))))
  );
drop policy if exists "invitees respond to relationship invitations" on public.owner_agent_relationships;
create policy "invitees respond to relationship invitations" on public.owner_agent_relationships
  for update to authenticated using (
    status = 'INVITED' and ((invited_by = 'OWNER' and agent_id = (select auth.uid()))
      or (invited_by = 'AGENT' and owner_id = (select auth.uid())))
  ) with check (
    ((invited_by = 'OWNER' and agent_id = (select auth.uid()))
      or (invited_by = 'AGENT' and owner_id = (select auth.uid())))
    and status in ('ACCEPTED', 'REJECTED')
  );
drop policy if exists "admins manage owner agent relationships" on public.owner_agent_relationships;
create policy "admins manage owner agent relationships" on public.owner_agent_relationships
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));

drop policy if exists "agents can create authorized drafts" on public.properties;
create policy "agents can create authorized drafts" on public.properties
  for insert to authenticated with check (
    authorized_agent_id = (select auth.uid()) and listing_status = 'DRAFT'
    and (select private.has_role('AGENT')) and exists (
      select 1 from public.owner_agent_relationships r
      where r.owner_id = public.properties.owner_id and r.agent_id = (select auth.uid())
        and r.status in ('ACCEPTED', 'ACTIVE')
    )
  );
drop policy if exists "authorized agents edit drafts" on public.properties;
create policy "authorized agents edit drafts" on public.properties
  for update to authenticated using (
    authorized_agent_id = (select auth.uid()) and listing_status in ('DRAFT', 'CHANGES_REQUIRED')
  ) with check (
    authorized_agent_id = (select auth.uid()) and listing_status in ('DRAFT', 'CHANGES_REQUIRED')
  );
grant insert (id, owner_id, authorized_agent_id, title, city, area, address,
  property_type, listing_type, price, latitude, longitude, property_data)
  on public.properties to authenticated;

drop policy if exists "owners and agents update applications" on public.property_applications;
create policy "owners and agents update applications" on public.property_applications
  for update to authenticated using (exists (
    select 1 from public.properties p where p.id = property_id
      and (p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid()))
  )) with check (exists (
    select 1 from public.properties p where p.id = property_id
      and (p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid()))
  ));
drop policy if exists "admins read all notifications" on public.notifications;
create policy "admins read all notifications" on public.notifications
  for select to authenticated using ((select private.has_role('ADMIN')));
grant update (listing_status, updated_at) on public.properties to authenticated;
drop policy if exists "admins review listings" on public.properties;
create policy "admins review listings" on public.properties
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));

-- The final trigger definition (after all role tables exist) creates exactly
-- one role profile and never lets signup choose an admin role.
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
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''), requested_role);
  if requested_role = 'SEEKER' then
    insert into public.seeker_profiles (user_id) values (new.id);
  elsif requested_role = 'OWNER' then
    insert into public.owner_profiles (user_id) values (new.id);
  else
    insert into public.agent_profiles (user_id) values (new.id);
  end if;
  return new;
end;
$$;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

-- Admins can review cross-role data; role status stays controlled by service
-- operations and is not exposed as a client update column.
drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles" on public.profiles
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read seeker profiles" on public.seeker_profiles;
create policy "admins read seeker profiles" on public.seeker_profiles
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read owner profiles" on public.owner_profiles;
create policy "admins read owner profiles" on public.owner_profiles
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read agent profiles" on public.agent_profiles;
create policy "admins read agent profiles" on public.agent_profiles
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read marketplace listings" on public.properties;
create policy "admins read marketplace listings" on public.properties
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read listing media" on public.property_media;
create policy "admins read listing media" on public.property_media
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read owner agent relationships" on public.owner_agent_relationships;
create policy "admins read owner agent relationships" on public.owner_agent_relationships
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read enquiries" on public.property_enquiries;
create policy "admins read enquiries" on public.property_enquiries
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read applications" on public.property_applications;
create policy "admins read applications" on public.property_applications
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read enquiry messages" on public.enquiry_messages;
create policy "admins read enquiry messages" on public.enquiry_messages
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read inspections" on public.inspection_requests;
create policy "admins read inspections" on public.inspection_requests
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins read agent credentials" on public.agent_credentials;
create policy "admins read agent credentials" on public.agent_credentials
  for select to authenticated using ((select private.has_role('ADMIN')));
drop policy if exists "admins review agent credentials" on public.agent_credentials;
create policy "admins review agent credentials" on public.agent_credentials
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));
drop policy if exists "staff create approval requests" on public.approval_requests;
create policy "staff create approval requests" on public.approval_requests
  for insert to authenticated with check (
    requester_user_id = (select auth.uid()) and exists (
      select 1 from public.staff_accounts s
      where s.id = requester_staff_id and s.user_id = (select auth.uid())
        and s.status = 'ACTIVE'
    ) and status = 'PENDING'
  );
drop policy if exists "admins update inspection status" on public.inspection_requests;
create policy "admins update inspection status" on public.inspection_requests
  for update to authenticated using ((select private.has_role('ADMIN')))
  with check ((select private.has_role('ADMIN')));
drop policy if exists "hosts update inspection status" on public.inspection_requests;
create policy "hosts update inspection status" on public.inspection_requests
  for update to authenticated using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

-- Validate client-created records at the database boundary.
drop policy if exists "agents submit own credentials" on public.agent_credentials;
create policy "agents submit own credentials" on public.agent_credentials
  for insert to authenticated with check (
    agent_id = (select auth.uid()) and status = 'PENDING'
      and reviewed_by is null and reviewed_at is null
      and (select private.has_role('AGENT'))
  );
drop policy if exists "seekers request inspections" on public.inspection_requests;
create policy "seekers request inspections" on public.inspection_requests
  for insert to authenticated with check (
    seeker_id = (select auth.uid()) and status = 'REQUESTED'
      and (select private.has_role('SEEKER')) and exists (
        select 1 from public.properties p where p.id = property_id
          and p.listing_status in ('VERIFIED', 'ACTIVE', 'RESERVED')
          and host_id = coalesce(p.authorized_agent_id, p.owner_id)
      )
  );
drop policy if exists "reporters create reports" on public.listing_reports;
create policy "reporters create reports" on public.listing_reports
  for insert to authenticated with check (
    reporter_id = (select auth.uid()) and status = 'REPORTED'
      and resolved_by is null and resolved_at is null
  );
drop policy if exists "users upload own documents" on public.user_documents;
create policy "users upload own documents" on public.user_documents
  for insert to authenticated with check (user_id = (select auth.uid()) and status = 'PENDING');
drop policy if exists "owners and agents upload property documents" on public.property_documents;
create policy "owners and agents upload property documents" on public.property_documents
  for insert to authenticated with check (
    uploaded_by = (select auth.uid()) and status = 'PENDING' and exists (
      select 1 from public.properties p where p.id = property_id
        and (p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid()))
    )
  );
drop policy if exists "participants send enquiry messages" on public.enquiry_messages;
create policy "participants send enquiry messages" on public.enquiry_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and read_at is null and exists (
      select 1 from public.profiles u where u.id = sender_id and u.role = sender_role
    ) and exists (
      select 1 from public.property_enquiries e where e.id = enquiry_id
        and (e.seeker_id = (select auth.uid()) or e.host_id = (select auth.uid()))
    )
  );

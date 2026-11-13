-- Persist verification work and immutable assignment/review history without
-- duplicating existing property verification or document tables.
create table if not exists public.verification_tasks (
  id text primary key,
  property_id text,
  subject_type text not null default 'PROPERTY' check (subject_type in ('PROPERTY', 'USER')),
  subject_id text not null,
  task_type text not null check (task_type in ('IDENTITY', 'LOCATION', 'OWNERSHIP', 'AVAILABILITY', 'MEDIA', 'INSPECTION', 'MODERATION', 'TRUST_SAFETY')),
  required_role text not null check (required_role in ('VERIFICATION_OFFICER', 'PROPERTY_MODERATOR', 'TRUST_SAFETY_INVESTIGATOR', 'INSPECTION_COORDINATOR')),
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'UNASSIGNED' check (status in ('UNASSIGNED', 'ASSIGNED', 'UNDER_REVIEW', 'COMPLETED', 'ESCALATED')),
  region text,
  due_at timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_type, subject_id, task_type)
);
create index if not exists verification_tasks_assignee_status_due_idx
  on public.verification_tasks (assigned_to, status, due_at);
create index if not exists verification_tasks_property_status_idx
  on public.verification_tasks (property_id, status);

create table if not exists public.assignment_history (
  id bigint generated always as identity primary key,
  task_id text not null references public.verification_tasks(id) on delete restrict,
  from_user_id uuid references public.profiles(id) on delete set null,
  to_user_id uuid references public.profiles(id) on delete set null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists assignment_history_task_created_idx
  on public.assignment_history (task_id, created_at desc);

create table if not exists public.document_review_history (
  id bigint generated always as identity primary key,
  document_id text not null,
  subject_type text not null check (subject_type in ('PROPERTY', 'USER')),
  subject_id text not null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  previous_status text,
  new_status text not null check (new_status in ('ASSIGNED', 'UNDER_REVIEW', 'APPROVED', 'VERIFIED', 'REJECTED', 'CHANGES_REQUIRED')),
  reason text,
  document_version integer not null default 1 check (document_version > 0),
  created_at timestamptz not null default now()
);
alter table public.user_documents drop constraint if exists user_documents_status_check;
alter table public.user_documents add constraint user_documents_status_check
  check (status in ('PENDING', 'ASSIGNED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'CHANGES_REQUIRED'));
create index if not exists document_review_history_document_idx
  on public.document_review_history (subject_type, document_id, created_at desc);

create or replace function private.has_staff_role(required_roles text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_accounts s
    where s.user_id = (select auth.uid()) and s.status = 'ACTIVE'
      and s.roles && required_roles
  );
$$;
revoke all on function private.has_staff_role(text[]) from public, anon;
grant execute on function private.has_staff_role(text[]) to authenticated;

create or replace function private.is_public_property(target_property_id text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.properties p
    join public.property_verifications v on v.property_id = p.id
    where p.id = target_property_id
      and p.listing_status in ('VERIFIED', 'ACTIVE', 'RESERVED', 'OCCUPIED')
      and coalesce(p.property_data ->> 'suspended', 'false') <> 'true'
      and v.overall_status = 'PASSED'
      and v.owner_identity_status = 'PASSED'
      and v.location_status = 'PASSED'
      and v.authority_document_status = 'PASSED'
      and v.availability_status = 'PASSED'
      and v.media_status = 'PASSED'
      and v.inspection_status = 'PASSED'
      and exists (
        select 1 from public.property_documents d
        where d.property_id = p.id and d.status = 'APPROVED'
          and d.document_type in ('DEED_OF_ASSIGNMENT', 'CERTIFICATE_OF_OCCUPANCY', 'GOVERNORS_CONSENT', 'LETTER_OF_AUTHORITY', 'RECEIPT_OF_PURCHASE')
      )
      and exists (
        select 1 from public.property_media m
        where m.property_id = p.id and lower(coalesce(m.media_data ->> 'type', '')) = 'image'
      )
  );
$$;
revoke all on function private.is_public_property(text) from public;
grant execute on function private.is_public_property(text) to anon, authenticated;

alter table public.verification_tasks enable row level security;
alter table public.assignment_history enable row level security;
alter table public.document_review_history enable row level security;

drop policy if exists "staff read assigned verification tasks" on public.verification_tasks;
create policy "staff read assigned verification tasks" on public.verification_tasks
  for select to authenticated using (
    assigned_to = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN']))
  );
drop policy if exists "staff read assignment history" on public.assignment_history;
create policy "staff read assignment history" on public.assignment_history
  for select to authenticated using (
    exists (select 1 from public.verification_tasks t where t.id = task_id
      and (t.assigned_to = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN']))))
  );
drop policy if exists "staff read assigned document review history" on public.document_review_history;
create policy "staff read assigned document review history" on public.document_review_history
  for select to authenticated using (
    reviewer_id = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.subject_type = document_review_history.subject_type
        and t.subject_id = document_review_history.subject_id and t.assigned_to = (select auth.uid())
    )
  );
grant select on public.verification_tasks, public.assignment_history, public.document_review_history to authenticated;
grant all on public.verification_tasks, public.assignment_history, public.document_review_history to service_role;

create or replace function public.assign_verification_task(
  target_task_id text, target_user_id uuid, actor_user_id uuid, assignment_reason text
)
returns public.verification_tasks
language plpgsql security definer
set search_path = ''
as $$
declare
  task_row public.verification_tasks;
  previous_assignee uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only trusted server operations can assign verification tasks';
  end if;
  select * into task_row from public.verification_tasks where id = target_task_id for update;
  if not found then raise exception 'Verification task not found'; end if;
  if target_user_id is not null and not exists (
    select 1 from public.staff_accounts s
    where s.user_id = target_user_id and s.status = 'ACTIVE'
      and task_row.required_role = any(s.roles)
      and (coalesce(s.scope ->> 'scopeType', 'GLOBAL') <> 'REGIONAL'
        or lower(coalesce(s.scope ->> 'region', '')) = lower(coalesce(task_row.region, '')))
  ) then raise exception 'Assignee is not active, authorized, or in scope for this task'; end if;
  previous_assignee := task_row.assigned_to;
  update public.verification_tasks
    set assigned_to = target_user_id,
        status = case when target_user_id is null then 'UNASSIGNED' else 'ASSIGNED' end,
        updated_at = now()
    where id = target_task_id returning * into task_row;
  if previous_assignee is distinct from target_user_id then
    insert into public.assignment_history (task_id, from_user_id, to_user_id, changed_by, reason)
      values (target_task_id, previous_assignee, target_user_id, actor_user_id, assignment_reason);
  end if;
  return task_row;
end;
$$;
revoke all on function public.assign_verification_task(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.assign_verification_task(text, uuid, uuid, text) to service_role;

create or replace function public.complete_verification_task(
  target_property_id text, target_task_type text, actor_user_id uuid, completion_notes text
)
returns public.verification_tasks
language plpgsql security definer
set search_path = ''
as $$
declare task_row public.verification_tasks;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Only trusted server operations can complete verification tasks';
  end if;
  select * into task_row from public.verification_tasks
    where property_id = target_property_id and task_type = target_task_type for update;
  if not found then raise exception 'Verification task not found'; end if;
  if task_row.assigned_to is distinct from actor_user_id and not exists (
    select 1 from public.staff_accounts s where s.user_id = actor_user_id
      and s.status = 'ACTIVE' and 'SUPER_ADMIN' = any(s.roles)
  ) then raise exception 'This task is not assigned to this officer'; end if;
  update public.verification_tasks set status = 'COMPLETED', notes = completion_notes, updated_at = now()
    where id = task_row.id returning * into task_row;
  return task_row;
end;
$$;
revoke all on function public.complete_verification_task(text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.complete_verification_task(text, text, uuid, text) to service_role;

-- Replace status-only exposure with the same mandatory checklist/document/media gate.
drop policy if exists "public can read active listings" on public.properties;
create policy "public can read eligible marketplace listings" on public.properties
  for select to anon, authenticated using ((select private.is_public_property(id)));
drop policy if exists "admins read marketplace listings" on public.properties;
create policy "super admins and assigned staff read listings" on public.properties
  for select to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.property_id = properties.id
        and t.assigned_to = (select auth.uid())
    )
  );
drop policy if exists "admins read listing media" on public.property_media;
create policy "super admins and assigned staff read listing media" on public.property_media
  for select to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.property_id = property_media.property_id
        and t.assigned_to = (select auth.uid())
    ) or (select private.is_public_property(property_id))
  );

-- Staff can access sensitive evidence only for their assigned identity/ownership case.
drop policy if exists "property stakeholders read property documents" on public.property_documents;
create policy "property owners agents and assigned officers read documents" on public.property_documents
  for select to authenticated using (
    exists (select 1 from public.properties p where p.id = property_id
      and (p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid())))
    or (select private.has_staff_role(array['SUPER_ADMIN']))
    or exists (select 1 from public.verification_tasks t where t.property_id = property_documents.property_id
      and t.assigned_to = (select auth.uid()) and t.task_type in ('IDENTITY', 'OWNERSHIP'))
  );
drop policy if exists "admins review property documents" on public.property_documents;
create policy "assigned officers review property documents" on public.property_documents
  for update to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.property_id = property_documents.property_id
        and t.assigned_to = (select auth.uid()) and t.task_type = 'OWNERSHIP'
    )
  ) with check (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.property_id = property_documents.property_id
        and t.assigned_to = (select auth.uid()) and t.task_type = 'OWNERSHIP'
    )
  );

drop policy if exists "users and admins read user documents" on public.user_documents;
create policy "users and assigned identity officers read user documents" on public.user_documents
  for select to authenticated using (
    user_id = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN']))
    or exists (select 1 from public.verification_tasks t where t.subject_type = 'USER'
      and t.subject_id = user_documents.user_id::text and t.assigned_to = (select auth.uid())
      and t.task_type = 'IDENTITY')
  );
drop policy if exists "admins review user documents" on public.user_documents;
create policy "assigned officers review user documents" on public.user_documents
  for update to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.subject_type = 'USER'
        and t.subject_id = user_documents.user_id::text and t.assigned_to = (select auth.uid())
        and t.task_type = 'IDENTITY'
    )
  ) with check (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.subject_type = 'USER'
        and t.subject_id = user_documents.user_id::text and t.assigned_to = (select auth.uid())
        and t.task_type = 'IDENTITY'
    )
  );

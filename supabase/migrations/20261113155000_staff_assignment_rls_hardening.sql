-- Narrow direct Supabase API access to active staff roles and assigned cases.
create or replace function private.staff_can_view_user(target_user_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
    select 1 from public.verification_tasks t
    where t.assigned_to = (select auth.uid()) and t.status <> 'UNASSIGNED'
      and ((t.subject_type = 'USER' and t.subject_id = target_user_id::text)
        or (t.subject_type = 'PROPERTY' and exists (
          select 1 from public.properties p where p.id = t.property_id
            and (p.owner_id = target_user_id or p.authorized_agent_id = target_user_id)
        )))
  );
$$;
revoke all on function private.staff_can_view_user(uuid) from public, anon;
grant execute on function private.staff_can_view_user(uuid) to authenticated;

drop policy if exists "staff read own account or admin manages staff" on public.staff_accounts;
create policy "staff read own account or authorized staff managers" on public.staff_accounts
  for select to authenticated using (
    user_id = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN', 'STAFF_MANAGER']))
  );
drop policy if exists "admins manage staff accounts" on public.staff_accounts;
revoke insert, update, delete on public.staff_accounts from authenticated;

drop policy if exists "admins review property verification" on public.property_verifications;
create policy "assigned staff read verification records" on public.property_verifications
  for select to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.property_id = property_verifications.property_id
        and t.assigned_to = (select auth.uid()) and t.status <> 'UNASSIGNED'
    )
  );
revoke insert, update, delete on public.property_verifications from authenticated;

drop policy if exists "admins review listings" on public.properties;
revoke update (listing_status) on public.properties from authenticated;

drop policy if exists "admins read all profiles" on public.profiles;
create policy "staff read assigned case profiles" on public.profiles
  for select to authenticated using ((select private.staff_can_view_user(id)));
drop policy if exists "admins read seeker profiles" on public.seeker_profiles;
create policy "staff read assigned seeker profiles" on public.seeker_profiles
  for select to authenticated using ((select private.staff_can_view_user(user_id)));
drop policy if exists "admins read owner profiles" on public.owner_profiles;
create policy "staff read assigned owner profiles" on public.owner_profiles
  for select to authenticated using ((select private.staff_can_view_user(user_id)));
drop policy if exists "admins read agent profiles" on public.agent_profiles;
create policy "staff read assigned agent profiles" on public.agent_profiles
  for select to authenticated using ((select private.staff_can_view_user(user_id)));

drop policy if exists "admins read owner agent relationships" on public.owner_agent_relationships;
drop policy if exists "admins manage owner agent relationships" on public.owner_agent_relationships;
create policy "staff read assigned owner agent relationships" on public.owner_agent_relationships
  for select to authenticated using (
    owner_id = (select auth.uid()) or agent_id = (select auth.uid())
    or (select private.staff_can_view_user(owner_id)) or (select private.staff_can_view_user(agent_id))
  );

drop policy if exists "admins read agent credentials" on public.agent_credentials;
create policy "assigned staff read agent credentials" on public.agent_credentials
  for select to authenticated using (
    agent_id = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN']))
    or exists (select 1 from public.verification_tasks t where t.subject_type = 'USER'
      and t.subject_id = agent_credentials.agent_id::text and t.assigned_to = (select auth.uid())
      and t.task_type = 'IDENTITY' and t.status <> 'UNASSIGNED')
  );
drop policy if exists "admins review agent credentials" on public.agent_credentials;
create policy "assigned staff review agent credentials" on public.agent_credentials
  for update to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.subject_type = 'USER'
        and t.subject_id = agent_credentials.agent_id::text and t.assigned_to = (select auth.uid())
        and t.task_type = 'IDENTITY' and t.status <> 'UNASSIGNED'
    )
  ) with check (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.subject_type = 'USER'
        and t.subject_id = agent_credentials.agent_id::text and t.assigned_to = (select auth.uid())
        and t.task_type = 'IDENTITY' and t.status <> 'UNASSIGNED'
    )
  );

drop policy if exists "admins read ledger" on public.audit_logs;
drop policy if exists "admins read audit ledger" on public.audit_logs;
create policy "authorized auditors read audit ledger" on public.audit_logs
  for select to authenticated using ((select private.has_staff_role(array['SUPER_ADMIN', 'COMPLIANCE_AUDITOR'])));
revoke insert, update, delete on public.audit_logs from authenticated;

drop policy if exists "admins read all notifications" on public.notifications;
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "admins read approval queue" on public.approval_requests;
create policy "staff read own approval requests or super admins" on public.approval_requests
  for select to authenticated using (requester_user_id = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN'])));
drop policy if exists "admins update approval queue" on public.approval_requests;
create policy "super admins decide approval requests" on public.approval_requests
  for update to authenticated using ((select private.has_staff_role(array['SUPER_ADMIN'])))
  with check ((select private.has_staff_role(array['SUPER_ADMIN'])));

drop policy if exists "admins read inspections" on public.inspection_requests;
drop policy if exists "inspection participants read" on public.inspection_requests;
create policy "staff read assigned inspections" on public.inspection_requests
  for select to authenticated using (
    seeker_id = (select auth.uid()) or host_id = (select auth.uid())
    or (select private.has_staff_role(array['SUPER_ADMIN']))
    or exists (select 1 from public.verification_tasks t where t.property_id = inspection_requests.property_id
      and t.assigned_to = (select auth.uid()) and t.task_type = 'INSPECTION' and t.status <> 'UNASSIGNED')
  );
drop policy if exists "admins update inspection status" on public.inspection_requests;
create policy "assigned staff update inspections" on public.inspection_requests
  for update to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.property_id = inspection_requests.property_id
        and t.assigned_to = (select auth.uid()) and t.task_type = 'INSPECTION' and t.status <> 'UNASSIGNED'
    )
  ) with check (
    (select private.has_staff_role(array['SUPER_ADMIN'])) or exists (
      select 1 from public.verification_tasks t where t.property_id = inspection_requests.property_id
        and t.assigned_to = (select auth.uid()) and t.task_type = 'INSPECTION' and t.status <> 'UNASSIGNED'
    )
  );

drop policy if exists "reporters and admins read reports" on public.listing_reports;
create policy "reporters and super admins read reports" on public.listing_reports
  for select to authenticated using (reporter_id = (select auth.uid()) or (select private.has_staff_role(array['SUPER_ADMIN'])));
drop policy if exists "admins update report cases" on public.listing_reports;
create policy "super admins update report cases" on public.listing_reports
  for update to authenticated using ((select private.has_staff_role(array['SUPER_ADMIN'])))
  with check ((select private.has_staff_role(array['SUPER_ADMIN'])));

-- Media is public only when the property itself passes every publication gate.
drop policy if exists "media follows listing visibility" on public.property_media;
create policy "eligible listing media or stakeholders read" on public.property_media
  for select to anon, authenticated using (
    (select private.is_public_property(property_id))
    or exists (select 1 from public.properties p where p.id = property_id
      and (p.owner_id = (select auth.uid()) or p.authorized_agent_id = (select auth.uid())))
    or (select private.has_staff_role(array['SUPER_ADMIN']))
    or exists (select 1 from public.verification_tasks t where t.property_id = property_media.property_id
      and t.assigned_to = (select auth.uid()))
  );

-- The marketplace-specific repository has not moved the messaging domain to
-- Supabase yet. Keep platform staff access limited to Super Admin until there
-- is an explicit support case assignment table.
drop policy if exists "admins read enquiries" on public.property_enquiries;
create policy "super admins read enquiries" on public.property_enquiries
  for select to authenticated using ((select private.has_staff_role(array['SUPER_ADMIN'])));
drop policy if exists "admins read applications" on public.property_applications;
create policy "super admins read applications" on public.property_applications
  for select to authenticated using ((select private.has_staff_role(array['SUPER_ADMIN'])));
drop policy if exists "admins read enquiry messages" on public.enquiry_messages;
create policy "super admins read enquiry messages" on public.enquiry_messages
  for select to authenticated using ((select private.has_staff_role(array['SUPER_ADMIN'])));

-- Auditors may inspect workflow metadata/history, but this does not grant file access.
drop policy if exists "staff read assigned verification tasks" on public.verification_tasks;
create policy "staff and auditors read verification tasks" on public.verification_tasks
  for select to authenticated using (
    assigned_to = (select auth.uid())
    or (select private.has_staff_role(array['SUPER_ADMIN', 'COMPLIANCE_AUDITOR']))
  );
drop policy if exists "staff read assignment history" on public.assignment_history;
create policy "staff and auditors read assignment history" on public.assignment_history
  for select to authenticated using (
    (select private.has_staff_role(array['SUPER_ADMIN', 'COMPLIANCE_AUDITOR']))
    or exists (select 1 from public.verification_tasks t where t.id = task_id and t.assigned_to = (select auth.uid()))
  );
drop policy if exists "staff read assigned document review history" on public.document_review_history;
create policy "staff and auditors read document review history" on public.document_review_history
  for select to authenticated using (
    reviewer_id = (select auth.uid())
    or (select private.has_staff_role(array['SUPER_ADMIN', 'COMPLIANCE_AUDITOR']))
    or exists (select 1 from public.verification_tasks t where t.subject_type = document_review_history.subject_type
      and t.subject_id = document_review_history.subject_id and t.assigned_to = (select auth.uid()))
  );

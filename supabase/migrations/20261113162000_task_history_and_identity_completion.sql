-- Capture first-time unassigned routing decisions once, even when no assignee exists.
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
      and (coalesce(s.scope ->> 'scopeType', 'GLOBAL') <> 'ASSIGNED_ONLY'
        or coalesce(s.scope -> 'assignedResourceIds', '[]'::jsonb) ? coalesce(task_row.property_id, task_row.subject_id))
  ) then raise exception 'Assignee is not active, authorized, or in scope for this task'; end if;
  previous_assignee := task_row.assigned_to;
  update public.verification_tasks
    set assigned_to = target_user_id,
        status = case when target_user_id is null then 'UNASSIGNED' else 'ASSIGNED' end,
        updated_at = now()
    where id = target_task_id returning * into task_row;
  if previous_assignee is distinct from target_user_id or (
    previous_assignee is null and target_user_id is null and not exists (
      select 1 from public.assignment_history h where h.task_id = target_task_id
        and h.to_user_id is null and h.reason = assignment_reason
    )
  ) then
    insert into public.assignment_history (task_id, from_user_id, to_user_id, changed_by, reason)
      values (target_task_id, previous_assignee, target_user_id, actor_user_id, assignment_reason);
  end if;
  return task_row;
end;
$$;
revoke all on function public.assign_verification_task(text, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.assign_verification_task(text, uuid, uuid, text) to service_role;

create or replace function public.complete_user_identity_task(target_user_id text, actor_user_id uuid, completion_notes text)
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
    where subject_type = 'USER' and subject_id = target_user_id and task_type = 'IDENTITY' for update;
  if not found then raise exception 'Identity task not found'; end if;
  if task_row.assigned_to is distinct from actor_user_id and not exists (
    select 1 from public.staff_accounts s where s.user_id = actor_user_id
      and s.status = 'ACTIVE' and 'SUPER_ADMIN' = any(s.roles)
  ) then raise exception 'This identity task is not assigned to this officer'; end if;
  update public.verification_tasks set status = 'COMPLETED', notes = completion_notes, updated_at = now()
    where id = task_row.id returning * into task_row;
  return task_row;
end;
$$;
revoke all on function public.complete_user_identity_task(text, uuid, text) from public, anon, authenticated;
grant execute on function public.complete_user_identity_task(text, uuid, text) to service_role;

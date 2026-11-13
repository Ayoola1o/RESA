import 'server-only';

import { User } from '@/types/prophunta';
import { StaffAccount, StaffRole } from '@/types/admin-governance';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { staffAuthorizationService } from './staff-authorization-service';
import { auditRepository } from '../repositories/audit-repository';
import { isEligibleAssignee, selectLeastLoadedAssignee } from '@/lib/verification-assignment-rules';

export type VerificationTaskType = 'IDENTITY' | 'LOCATION' | 'OWNERSHIP' | 'AVAILABILITY' | 'MEDIA' | 'INSPECTION' | 'MODERATION' | 'TRUST_SAFETY';
type TaskRole = Extract<StaffRole, 'VERIFICATION_OFFICER' | 'PROPERTY_MODERATOR' | 'TRUST_SAFETY_INVESTIGATOR' | 'INSPECTION_COORDINATOR'>;

const TASKS: Array<{ type: VerificationTaskType; role: TaskRole }> = [
  { type: 'IDENTITY', role: 'VERIFICATION_OFFICER' },
  { type: 'LOCATION', role: 'VERIFICATION_OFFICER' },
  { type: 'OWNERSHIP', role: 'VERIFICATION_OFFICER' },
  { type: 'AVAILABILITY', role: 'VERIFICATION_OFFICER' },
  { type: 'INSPECTION', role: 'INSPECTION_COORDINATOR' },
  { type: 'MODERATION', role: 'PROPERTY_MODERATOR' },
];

export class VerificationAssignmentService {
  private client() {
    const client = getSupabaseAdminClient();
    if (!client) throw new Error('Verification assignment persistence requires the Supabase server secret key.');
    return client;
  }

  private async listActiveStaff(): Promise<StaffAccount[]> {
    const { data, error } = await this.client().from('staff_accounts').select('*').eq('status', 'ACTIVE');
    if (error) throw new Error(`Could not load active officers: ${error.message}`);
    return (data || []).map((row) => ({
      id: String(row.id), userId: String(row.user_id), email: String(row.email), name: String(row.name),
      roles: (row.roles || []) as StaffRole[], status: row.status as StaffAccount['status'],
      scope: (row.scope || { scopeType: 'GLOBAL' }) as StaffAccount['scope'], delegation: row.delegation as StaffAccount['delegation'],
      customGrants: (row.custom_grants || []) as StaffAccount['customGrants'], invitedBy: row.invited_by as string | undefined,
      lastActiveAt: row.last_active_at as string | undefined, createdAt: String(row.created_at), updatedAt: String(row.updated_at),
    }));
  }

  async createPropertyTasks(property: { id: string; ownerId: string; state: string }, actor?: User) {
    const client = this.client();
    const staff = await this.listActiveStaff();
    const { data: existing, error: workloadError } = await client.from('verification_tasks')
      .select('assigned_to,status').in('status', ['ASSIGNED', 'UNDER_REVIEW', 'ESCALATED']);
    if (workloadError) throw new Error(`Could not calculate officer workload: ${workloadError.message}`);
    const workloads = new Map<string, number>();
    for (const task of existing || []) if (task.assigned_to) workloads.set(task.assigned_to, (workloads.get(task.assigned_to) || 0) + 1);

    const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const assigned: Array<{ id: string; assigned_to: string | null; task_type: VerificationTaskType; status: string }> = [];
    for (const task of TASKS) {
      const taskId = `property:${property.id}:${task.type.toLowerCase()}`;
      const { data: previousTask } = await client.from('verification_tasks').select('assigned_to').eq('id', taskId).maybeSingle();
      const previousAssignee = (previousTask?.assigned_to as string | null) || null;
      const candidates = staff.filter((candidate) => isEligibleAssignee(candidate, task.role, property.state, property.id));
      const selected = selectLeastLoadedAssignee(candidates, workloads);
      const { error } = await client.from('verification_tasks').upsert({
        id: taskId,
        property_id: property.id,
        subject_type: 'PROPERTY',
        subject_id: property.id,
        task_type: task.type,
        required_role: task.role,
        assigned_to: previousAssignee,
        status: previousAssignee ? 'ASSIGNED' : 'UNASSIGNED',
        region: property.state,
        due_at: deadline,
        created_by: actor?.id || null,
        metadata: { ownerId: property.ownerId },
      }, { onConflict: 'subject_type,subject_id,task_type', ignoreDuplicates: false });
      if (error) throw new Error(`Could not create ${task.type} task: ${error.message}`);
      const { data: result, error: assignError } = await client.rpc('assign_verification_task', {
        target_task_id: taskId,
        target_user_id: selected?.userId || null,
        actor_user_id: actor?.id || null,
        assignment_reason: selected ? 'Automatically assigned using role, region, and active workload.' : 'No active eligible officer is available; administrative attention required.',
      });
      if (assignError) throw new Error(`Could not assign ${task.type} task: ${assignError.message}`);
      const saved = (Array.isArray(result) ? result[0] : result) as { id: string; assigned_to: string | null; task_type: VerificationTaskType; status: string; updated_at?: string };
      assigned.push(saved);
      if (selected) {
        workloads.set(selected.userId, (workloads.get(selected.userId) || 0) + 1);
        if (saved.assigned_to !== previousAssignee) await this.notify(selected.userId, property.id, task.type, false, `${taskId}:${saved.updated_at || Date.now()}`);
      } else {
        const superAdmins = staff.filter((candidate) => candidate.roles.includes('SUPER_ADMIN'));
        for (const admin of superAdmins) await this.notify(admin.userId, property.id, task.type, true, `${taskId}:${Date.now()}`);
      }
      if (!saved.assigned_to) {
        await auditRepository.create({ actorId: actor?.id || 'system', actorEmail: actor?.email || 'system@prophunta.ai', actorRole: actor?.role || 'ADMIN', action: 'VERIFICATION_TASK_UNASSIGNED' as any, objectType: 'PROPERTY', objectId: property.id, result: 'FAILURE', metadata: { taskType: task.type, reason: 'No eligible active officer' } });
      }
    }
    return assigned;
  }

  async createUserIdentityTask(userId: string, actor?: User) {
    const client = this.client();
    const allStaff = await this.listActiveStaff();
    const region = actor?.location?.split(',').at(-1)?.trim() || '';
    const staff = allStaff.filter((item) => item.roles.includes('VERIFICATION_OFFICER') && isEligibleAssignee(item, 'VERIFICATION_OFFICER', region, userId));
    const { data: existing, error: workloadError } = await client.from('verification_tasks')
      .select('assigned_to').in('status', ['ASSIGNED', 'UNDER_REVIEW', 'ESCALATED']);
    if (workloadError) throw new Error(`Could not calculate officer workload: ${workloadError.message}`);
    const workloads = new Map<string, number>();
    for (const task of existing || []) if (task.assigned_to) workloads.set(task.assigned_to, (workloads.get(task.assigned_to) || 0) + 1);
    staff.sort((a, b) => (workloads.get(a.userId) || 0) - (workloads.get(b.userId) || 0) || a.userId.localeCompare(b.userId));
    const selected = staff[0];
    const taskId = `user:${userId}:identity`;
    const { data: prior } = await client.from('verification_tasks').select('assigned_to').eq('id', taskId).maybeSingle();
    const priorAssignee = (prior?.assigned_to as string | null) || null;
    const { error: saveError } = await client.from('verification_tasks').upsert({
      id: taskId, property_id: null, subject_type: 'USER', subject_id: userId, task_type: 'IDENTITY',
      required_role: 'VERIFICATION_OFFICER', assigned_to: priorAssignee, status: priorAssignee ? 'ASSIGNED' : 'UNASSIGNED', region: region || null,
      due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), created_by: actor?.id || null,
    }, { onConflict: 'subject_type,subject_id,task_type' });
    if (saveError) throw new Error(`Could not create identity verification task: ${saveError.message}`);
    const { data, error } = await client.rpc('assign_verification_task', {
      target_task_id: taskId, target_user_id: selected?.userId || null, actor_user_id: actor?.id || null,
      assignment_reason: selected ? 'Automatically assigned using verification role and active workload.' : 'No active verification officer is available; administrative attention required.',
    });
    if (error) throw new Error(`Could not assign identity verification: ${error.message}`);
    const saved = Array.isArray(data) ? data[0] : data;
    if (selected && (saved as any)?.assigned_to !== priorAssignee) await this.notify(selected.userId, userId, 'IDENTITY', false, `${taskId}:${(saved as any)?.updated_at || Date.now()}`);
    else if (!selected) for (const admin of allStaff.filter((candidate) => candidate.roles.includes('SUPER_ADMIN'))) await this.notify(admin.userId, userId, 'IDENTITY', true, `${taskId}:unassigned`);
    return saved;
  }

  async reassignTask(actor: User, taskId: string, targetUserId: string | null, reason: string) {
    if (!reason.trim()) throw new Error('Assignment reason is required.');
    const actorContext = await staffAuthorizationService.requirePermission(actor, 'verification.assign');
    const client = this.client();
    const { data: task, error: taskError } = await client.from('verification_tasks')
      .select('id,task_type,required_role,property_id,region,assigned_to').eq('id', taskId).single();
    if (taskError || !task) throw new Error('Verification task not found.');
    const previous = task.assigned_to as string | null;
    if (targetUserId) {
      const target = (await this.listActiveStaff()).find((candidate) => candidate.userId === targetUserId);
      if (!target || !isEligibleAssignee(target, task.required_role as StaffRole, task.region || '', task.property_id || taskId)) {
        throw new Error('Selected officer is not active, authorized, or in scope for this task.');
      }
      if (!actorContext.activeRoles.includes('SUPER_ADMIN') && !actorContext.staffAccount.delegation?.maxAssignableRoles.includes(task.required_role as StaffRole)) {
        throw new Error('Your staff delegation does not include assignment to this officer role.');
      }
    }
    const { data, error } = await client.rpc('assign_verification_task', {
      target_task_id: taskId, target_user_id: targetUserId,
      actor_user_id: actor.id, assignment_reason: reason.trim(),
    });
    if (error) throw new Error(error.message);
    const saved = Array.isArray(data) ? data[0] : data;
    if (targetUserId && targetUserId !== previous) await this.notify(targetUserId, task.property_id || taskId, task.task_type, false, `${taskId}:${(saved as any)?.updated_at || Date.now()}`);
    await auditRepository.create({ actorId: actor.id, actorEmail: actor.email, actorRole: actor.role, action: 'VERIFICATION_TASK_REASSIGNED' as any, objectType: 'PROPERTY', objectId: task.property_id || taskId, result: 'SUCCESS', metadata: { taskId, from: previous, to: targetUserId, reason: reason.trim() } });
    return saved;
  }

  async assertAssigned(actor: User, propertyId: string, taskTypes?: VerificationTaskType[]) {
    return this.assertTaskAssigned(actor, 'verification.review', 'PROPERTY', propertyId, taskTypes);
  }

  async assertTaskAssigned(actor: User, permission: import('@/types/admin-governance').AdminPermission, subjectType: 'PROPERTY' | 'USER', subjectId: string, taskTypes?: VerificationTaskType[]) {
    const context = await staffAuthorizationService.requirePermission(actor, permission);
    if (context.activeRoles.includes('SUPER_ADMIN')) return;
    const client = this.client();
    let query = client.from('verification_tasks').select('id').eq('subject_type', subjectType).eq('subject_id', subjectId).eq('assigned_to', actor.id).neq('status', 'UNASSIGNED');
    if (taskTypes?.length) query = query.in('task_type', taskTypes);
    const { data, error } = await query.limit(1);
    if (error) throw new Error(`Could not verify case assignment: ${error.message}`);
    if (!data?.length) throw new Error('This case is not assigned to you.');
  }

  async assertUserAssigned(actor: User, userId: string) {
    return this.assertTaskAssigned(actor, 'documents.review', 'USER', userId, ['IDENTITY']);
  }

  async completeUserIdentityTask(actor: User, userId: string, notes: string) {
    await this.assertUserAssigned(actor, userId);
    const { data, error } = await this.client().rpc('complete_user_identity_task', {
      target_user_id: userId, actor_user_id: actor.id, completion_notes: notes,
    });
    if (error) throw new Error(`Could not complete identity review: ${error.message}`);
    return Array.isArray(data) ? data[0] : data;
  }

  async completeTask(actor: User, propertyId: string, taskType: VerificationTaskType, notes: string) {
    const permission = taskType === 'MODERATION' ? 'properties.moderate'
      : taskType === 'INSPECTION' ? 'inspections.update' : 'verification.review';
    await this.assertTaskAssigned(actor, permission, 'PROPERTY', propertyId, [taskType]);
    const client = this.client();
    const { data, error } = await client.rpc('complete_verification_task', {
      target_property_id: propertyId, target_task_type: taskType, actor_user_id: actor.id, completion_notes: notes.trim(),
    });
    if (error) throw new Error(`Could not complete the assigned task: ${error.message}`);
    return data;
  }

  async recordDocumentReview(input: { documentId: string; subjectType: 'PROPERTY' | 'USER'; subjectId: string; reviewerId: string; previousStatus?: string; newStatus: string; reason?: string }) {
    const client = this.client();
    const { count, error: countError } = await client.from('document_review_history').select('id', { count: 'exact', head: true })
      .eq('subject_type', input.subjectType).eq('document_id', input.documentId);
    if (countError) throw new Error(`Could not read document review history: ${countError.message}`);
    const { error } = await client.from('document_review_history').insert({
      document_id: input.documentId, subject_type: input.subjectType, subject_id: input.subjectId,
      reviewer_id: input.reviewerId, previous_status: input.previousStatus || null,
      new_status: input.newStatus, reason: input.reason || null, document_version: (count || 0) + 1,
    });
    if (error) throw new Error(`Could not persist document review history: ${error.message}`);
  }

  async getAssignedPropertyIds(actor: User): Promise<string[] | null> {
    const context = await staffAuthorizationService.getStaffContext(actor);
    if (context?.activeRoles.includes('SUPER_ADMIN')) return null;
    if (!context) return [];
    const client = this.client();
    const { data, error } = await client.from('verification_tasks').select('property_id')
      .eq('assigned_to', actor.id).neq('status', 'UNASSIGNED').not('property_id', 'is', null);
    if (error) throw new Error(`Could not load assigned cases: ${error.message}`);
    return [...new Set((data || []).map((row) => row.property_id as string))];
  }

  async getAssignedUserIds(actor: User): Promise<string[] | null> {
    const context = await staffAuthorizationService.getStaffContext(actor);
    if (context?.activeRoles.includes('SUPER_ADMIN')) return null;
    if (!context) return [];
    const client = this.client();
    const { data, error } = await client.from('verification_tasks').select('subject_id')
      .eq('subject_type', 'USER').eq('assigned_to', actor.id).neq('status', 'UNASSIGNED');
    if (error) throw new Error(`Could not load assigned identity reviews: ${error.message}`);
    return [...new Set((data || []).map((row) => row.subject_id as string))];
  }

  private async notify(userId: string, propertyId: string, taskType: string, adminAttention: boolean, eventId: string) {
    const client = this.client();
    const { error } = await client.from('notifications').upsert({
      id: `assignment:${eventId}:${userId}`,
      user_id: userId,
      notification_type: 'VERIFICATION',
      title: adminAttention ? 'Unassigned verification task' : 'Verification task assigned',
      message: adminAttention ? `${taskType} task for property ${propertyId} has no eligible officer.` : `You have been assigned the ${taskType.toLowerCase()} review for property ${propertyId}.`,
      link: '/admin',
      is_read: false,
    }, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw new Error(`Could not notify assigned officer: ${error.message}`);
  }
}

export const verificationAssignmentService = new VerificationAssignmentService();

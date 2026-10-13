import { User } from '@/types/prophunta';
import {
  ApprovalActionType,
  ApprovalStatus,
  ApprovalRequest,
} from '@/types/admin-governance';
import { approvalRepository } from '../repositories/approval-repository';
import { staffAuthorizationService } from './staff-authorization-service';
import { propertyRepository } from '../repositories/property-repository';
import { userRepository } from '../repositories/user-repository';
import { staffRepository } from '../repositories/staff-repository';
import { auditRepository } from '../repositories/audit-repository';
import { getDb, saveDb } from '../db/store';

export class ApprovalService {
  /**
   * Submits a formal approval request for a high-impact administrative operation.
   */
  async submitApprovalRequest(
    actor: User,
    data: {
      actionType: ApprovalActionType;
      targetResourceType: 'PROPERTY' | 'USER' | 'STAFF' | 'SETTINGS';
      targetResourceId: string;
      proposedPayload: Record<string, any>;
      reason: string;
      supportingEvidence?: string;
    }
  ): Promise<ApprovalRequest> {
    const actorContext = await staffAuthorizationService.getStaffContext(actor);
    if (!actorContext) {
      throw new Error('Access Denied: Only active administrative staff can submit approval requests.');
    }

    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('A detailed operational justification (minimum 5 characters) is required.');
    }

    // Capture initial snapshot of the target resource to detect material state drift
    const initialSnapshot = await this.captureResourceSnapshot(
      data.targetResourceType,
      data.targetResourceId
    );

    // Default approval window: 48 hours
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const request = await approvalRepository.create({
      actionType: data.actionType,
      targetResourceType: data.targetResourceType,
      targetResourceId: data.targetResourceId,
      requesterStaffId: actorContext.staffAccount.id,
      requesterUserId: actor.id,
      requesterEmail: actor.email,
      proposedPayload: data.proposedPayload,
      initialSnapshot,
      reason: data.reason.trim(),
      supportingEvidence: data.supportingEvidence?.trim(),
      expiresAt,
    });

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'APPROVAL_REQUESTED',
      objectType: 'APPROVAL',
      objectId: request.id,
      result: 'SUCCESS',
      metadata: {
        actionType: data.actionType,
        targetResourceType: data.targetResourceType,
        targetResourceId: data.targetResourceId,
        reason: data.reason,
      },
    });

    return request;
  }

  /**
   * Lists all pending approval requests awaiting decision.
   */
  async listPendingApprovals(actor: User): Promise<ApprovalRequest[]> {
    await staffAuthorizationService.requirePermission(actor, 'approvals.view_assigned');
    return approvalRepository.listPending();
  }

  /**
   * Lists all approval requests (audit history).
   */
  async listAllApprovals(actor: User): Promise<ApprovalRequest[]> {
    await staffAuthorizationService.requirePermission(actor, 'approvals.view_assigned');
    return approvalRepository.listAll();
  }

  /**
   * Decides (APPROVE or REJECT) an approval request and executes approved actions atomically.
   * Strictly enforces the four-eyes principle: A requester CANNOT approve their own request.
   */
  async decideApproval(
    actor: User,
    approvalId: string,
    decision: 'APPROVE' | 'REJECT',
    decisionNotes?: string
  ): Promise<ApprovalRequest> {
    const requiredPermission = decision === 'APPROVE' ? 'approvals.approve' : 'approvals.reject';
    const actorContext = await staffAuthorizationService.requirePermission(actor, requiredPermission);

    const request = await approvalRepository.findById(approvalId);
    if (!request) throw new Error('Approval request not found.');

    // 1. Status Guard: Must be PENDING
    if (request.status !== 'PENDING') {
      throw new Error(`Cannot decide request: Current status is already ${request.status}.`);
    }

    // 2. Expiry Guard
    if (new Date(request.expiresAt) <= new Date()) {
      await approvalRepository.update(approvalId, { status: 'EXPIRED' });
      throw new Error('Approval request has expired and can no longer be decided.');
    }

    // 3. FOUR-EYES SEPARATION OF DUTIES: Requester cannot approve their own request!
    if (decision === 'APPROVE' && request.requesterStaffId === actorContext.staffAccount.id) {
      throw new Error(
        'Dual-Custody Violation: A requester must not approve their own approval request (Four-Eyes Principle).'
      );
    }

    const now = new Date().toISOString();

    if (decision === 'REJECT') {
      const updated = await approvalRepository.update(approvalId, {
        status: 'REJECTED',
        approverStaffId: actorContext.staffAccount.id,
        approverEmail: actor.email,
        decisionNotes: decisionNotes || 'Rejected by independent reviewer.',
        decidedAt: now,
      });

      await auditRepository.create({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'APPROVAL_REJECTED',
        objectType: 'APPROVAL',
        objectId: approvalId,
        result: 'SUCCESS',
        metadata: {
          decisionNotes,
          requesterStaffId: request.requesterStaffId,
        },
      });

      return updated!;
    }

    // 4. PRE-EXECUTION ATOMIC CHECKS: Validate target state has not drifted since request
    const currentState = await this.captureResourceSnapshot(
      request.targetResourceType,
      request.targetResourceId
    );

    const hasStateDrifted = this.hasMaterialStateDrift(request.initialSnapshot, currentState);
    if (hasStateDrifted) {
      await approvalRepository.update(approvalId, {
        status: 'CANCELLED',
        decisionNotes: 'Execution cancelled: Target resource state changed materially since request submission.',
        decidedAt: now,
      });
      throw new Error(
        'State Drift Detected: The target resource has been modified since this request was submitted. Action cancelled.'
      );
    }

    // 5. ATOMIC EXECUTION OF APPROVED ACTION
    try {
      await this.executeAction(request, actorContext.staffAccount.id);

      const executed = await approvalRepository.update(approvalId, {
        status: 'EXECUTED',
        approverStaffId: actorContext.staffAccount.id,
        approverEmail: actor.email,
        decisionNotes: decisionNotes || 'Approved and successfully executed.',
        decidedAt: now,
        executedAt: now,
        executionResult: 'SUCCESS',
      });

      await auditRepository.create({
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'APPROVAL_EXECUTED',
        objectType: 'APPROVAL',
        objectId: approvalId,
        result: 'SUCCESS',
        metadata: {
          actionType: request.actionType,
          targetResourceType: request.targetResourceType,
          targetResourceId: request.targetResourceId,
          requesterStaffId: request.requesterStaffId,
        },
      });

      return executed!;
    } catch (execErr: any) {
      await approvalRepository.update(approvalId, {
        status: 'APPROVED', // Marked approved but execution failed
        executionResult: 'FAILURE',
        executionError: execErr.message || 'Execution error',
        decidedAt: now,
      });
      throw new Error(`Approval granted, but execution failed: ${execErr.message}`);
    }
  }

  /**
   * Allows the original requester or Super Admin to cancel a pending approval request.
   */
  async cancelApprovalRequest(actor: User, approvalId: string): Promise<ApprovalRequest> {
    const actorContext = await staffAuthorizationService.getStaffContext(actor);
    if (!actorContext) throw new Error('Access denied.');

    const request = await approvalRepository.findById(approvalId);
    if (!request) throw new Error('Approval request not found.');

    if (request.status !== 'PENDING') {
      throw new Error(`Cannot cancel request: Current status is ${request.status}.`);
    }

    const isRequester = request.requesterStaffId === actorContext.staffAccount.id;
    const isSuperAdmin = actorContext.activeRoles.includes('SUPER_ADMIN');

    if (!isRequester && !isSuperAdmin) {
      throw new Error('Forbidden: Only the original requester or a Super Admin can cancel this request.');
    }

    const updated = await approvalRepository.update(approvalId, {
      status: 'CANCELLED',
      decisionNotes: 'Cancelled by requester/super admin.',
      decidedAt: new Date().toISOString(),
    });

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'APPROVAL_CANCELLED',
      objectType: 'APPROVAL',
      objectId: approvalId,
      result: 'SUCCESS',
    });

    return updated!;
  }

  /**
   * Narrowly scoped emergency procedure: Super Admin only, requires high-priority logging.
   */
  async executeEmergencyOverride(
    actor: User,
    data: {
      actionType: ApprovalActionType;
      targetResourceType: 'PROPERTY' | 'USER' | 'STAFF' | 'SETTINGS';
      targetResourceId: string;
      proposedPayload: Record<string, any>;
      incidentReference: string;
      mandatoryJustification: string;
    }
  ): Promise<ApprovalRequest> {
    const actorContext = await staffAuthorizationService.getStaffContext(actor);
    if (!actorContext || !actorContext.activeRoles.includes('SUPER_ADMIN')) {
      throw new Error('Access Denied: Emergency override procedure is strictly restricted to Super Admins.');
    }

    if (!data.incidentReference || data.incidentReference.trim().length < 3) {
      throw new Error('A verified security/operations incident reference is required.');
    }

    if (!data.mandatoryJustification || data.mandatoryJustification.trim().length < 10) {
      throw new Error('Emergency overrides require an exhaustive justification (minimum 10 characters).');
    }

    const now = new Date().toISOString();

    // Create record marked as emergency
    const request = await approvalRepository.create({
      actionType: data.actionType,
      targetResourceType: data.targetResourceType,
      targetResourceId: data.targetResourceId,
      requesterStaffId: actorContext.staffAccount.id,
      requesterUserId: actor.id,
      requesterEmail: actor.email,
      proposedPayload: data.proposedPayload,
      reason: `[EMERGENCY OVERRIDE - Ref: ${data.incidentReference}] ${data.mandatoryJustification}`,
      supportingEvidence: data.incidentReference,
      expiresAt: now,
      isEmergency: true,
    });

    // Execute immediately
    await this.executeAction(request, actorContext.staffAccount.id);

    const executed = await approvalRepository.update(request.id, {
      status: 'EXECUTED',
      approverStaffId: actorContext.staffAccount.id,
      approverEmail: actor.email,
      decisionNotes: `Emergency executed under incident ref ${data.incidentReference}`,
      decidedAt: now,
      executedAt: now,
      executionResult: 'SUCCESS',
    });

    await auditRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'EMERGENCY_OVERRIDE_EXECUTED',
      objectType: 'APPROVAL',
      objectId: request.id,
      result: 'SUCCESS',
      metadata: {
        incidentReference: data.incidentReference,
        actionType: data.actionType,
        targetResourceId: data.targetResourceId,
        justification: data.mandatoryJustification,
      },
    });

    return executed!;
  }

  // --- PRIVATE ATOMIC EXECUTION ROUTINES ---

  private async executeAction(request: ApprovalRequest, operatorStaffId: string): Promise<void> {
    switch (request.actionType) {
      case 'PROPERTY_RESTORE': {
        const prop = await propertyRepository.findById(request.targetResourceId);
        if (!prop) throw new Error('Target property no longer exists.');
        await propertyRepository.update(request.targetResourceId, {
          listingStatus: 'ACTIVE',
          availabilityStatus: 'AVAILABLE',
          verification: prop.verification
            ? {
                ...prop.verification,
                overallStatus: 'PASSED',
              }
            : undefined,
        });
        await auditRepository.create({
          actorId: request.requesterUserId,
          actorEmail: request.requesterEmail,
          actorRole: 'ADMIN',
          action: 'LISTING_RESTORED',
          objectType: 'PROPERTY',
          objectId: request.targetResourceId,
          result: 'SUCCESS',
          metadata: {
            approvalRequestId: request.id,
            reason: request.reason,
          },
        });
        break;
      }

      case 'USER_SUSPENSION': {
        const user = await userRepository.findById(request.targetResourceId);
        if (!user) throw new Error('Target user no longer exists.');
        await userRepository.update(request.targetResourceId, {
          verificationStatus: 'SUSPENDED',
        });
        // Revoke all sessions immediately
        this.revokeUserSessions(request.targetResourceId);
        await auditRepository.create({
          actorId: request.requesterUserId,
          actorEmail: request.requesterEmail,
          actorRole: 'ADMIN',
          action: 'USER_SUSPENDED',
          objectType: 'USER',
          objectId: request.targetResourceId,
          result: 'SUCCESS',
          metadata: {
            approvalRequestId: request.id,
            reason: request.reason,
          },
        });
        break;
      }

      case 'PRIVILEGED_STAFF_ROLE_CHANGE': {
        const staff = await staffRepository.findById(request.targetResourceId);
        if (!staff) throw new Error('Target staff account no longer exists.');
        const newRoles = request.proposedPayload.newRoles;
        if (!Array.isArray(newRoles)) throw new Error('Invalid roles payload.');
        await staffRepository.update(request.targetResourceId, { roles: newRoles });
        this.revokeUserSessions(staff.userId);
        await auditRepository.create({
          actorId: request.requesterUserId,
          actorEmail: request.requesterEmail,
          actorRole: 'ADMIN',
          action: 'STAFF_ROLES_UPDATED',
          objectType: 'STAFF',
          objectId: request.targetResourceId,
          result: 'SUCCESS',
          metadata: {
            approvalRequestId: request.id,
            newRoles,
          },
        });
        break;
      }

      default:
        // Generic approved execution
        break;
    }
  }

  private async captureResourceSnapshot(
    resourceType: 'PROPERTY' | 'USER' | 'STAFF' | 'SETTINGS',
    resourceId: string
  ): Promise<Record<string, any> | undefined> {
    if (resourceType === 'PROPERTY') {
      const p = await propertyRepository.findById(resourceId);
      return p ? { listingStatus: p.listingStatus, availabilityStatus: p.availabilityStatus, price: p.price } : undefined;
    }
    if (resourceType === 'USER') {
      const u = await userRepository.findById(resourceId);
      return u ? { role: u.role, verificationStatus: u.verificationStatus } : undefined;
    }
    if (resourceType === 'STAFF') {
      const s = await staffRepository.findById(resourceId);
      return s ? { roles: [...s.roles], status: s.status } : undefined;
    }
    return undefined;
  }

  private hasMaterialStateDrift(
    snapshot?: Record<string, any>,
    current?: Record<string, any>
  ): boolean {
    if (!snapshot || !current) return false;
    for (const key of Object.keys(snapshot)) {
      if (Array.isArray(snapshot[key])) {
        if (JSON.stringify(snapshot[key]) !== JSON.stringify(current[key])) return true;
      } else if (snapshot[key] !== current[key]) {
        return true;
      }
    }
    return false;
  }

  private revokeUserSessions(userId: string): void {
    const db = getDb();
    const tokens = Object.keys(db.sessions || {});
    let modified = false;
    for (const t of tokens) {
      if (db.sessions[t].userId === userId) {
        delete db.sessions[t];
        modified = true;
      }
    }
    if (modified) saveDb(db);
  }
}

export const approvalService = new ApprovalService();

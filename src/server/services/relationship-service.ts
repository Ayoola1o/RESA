import { User, OwnerAgentRelationship, Property } from '@/types/prophunta';
import { relationshipRepository } from '../repositories/relationship-repository';
import { userRepository } from '../repositories/user-repository';
import { auditRepository } from '../repositories/audit-repository';
import { notificationService } from './notification-service';

export class RelationshipService {
  async getRelationship(id: string): Promise<OwnerAgentRelationship | null> {
    return relationshipRepository.findById(id);
  }

  async getOwnerRelationships(ownerId: string): Promise<OwnerAgentRelationship[]> {
    return relationshipRepository.findByOwner(ownerId);
  }

  async getAgentRelationships(agentId: string): Promise<OwnerAgentRelationship[]> {
    return relationshipRepository.findByAgent(agentId);
  }

  /**
   * Owner invites an agent to represent properties under formal mandate
   */
  async inviteAgent(
    owner: User,
    data: {
      agentEmail: string;
      mandateType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | 'JOINT' | 'SUB_AGENT';
      commissionRate?: string;
      scope?: string;
      propertyIds?: string[];
      expiresAt?: string;
      notes?: string;
    }
  ): Promise<OwnerAgentRelationship> {
    if (owner.role !== 'OWNER' && owner.role !== 'ADMIN') {
      throw new Error('Only Property Owners or Administrators can invite an agent.');
    }

    const agent = await userRepository.findByEmail(data.agentEmail.toLowerCase().trim());
    if (!agent) {
      throw new Error(`No registered agent found with email "${data.agentEmail}".`);
    }

    if (agent.role !== 'AGENT' && agent.role !== 'ADMIN') {
      throw new Error(`User "${agent.name}" is registered as ${agent.role}, not an AGENT.`);
    }

    // Check for existing active or invited relationship
    const existing = await relationshipRepository.findByOwner(owner.id);
    const duplicate = existing.find(
      (r) => r.agentId === agent.id && (r.status === 'ACTIVE' || r.status === 'INVITED')
    );
    if (duplicate) {
      throw new Error(
        `An active or pending invitation already exists with agent "${agent.name}" (Status: ${duplicate.status}).`
      );
    }

    const now = new Date().toISOString();
    const relationship = await relationshipRepository.create({
      ownerId: owner.id,
      ownerName: owner.name,
      ownerEmail: owner.email,
      ownerPhone: owner.phone,
      agentId: agent.id,
      agentName: agent.name,
      agentEmail: agent.email,
      agentPhone: agent.phone,
      propertyIds: data.propertyIds || [],
      mandateType: data.mandateType,
      commissionRate: data.commissionRate || '5.0%',
      scope: data.scope || 'Representation, tenant screening, inspection walkthroughs, and lease facilitation.',
      status: 'INVITED',
      invitedBy: 'OWNER',
      invitedAt: now,
      expiresAt: data.expiresAt,
      notes: data.notes,
    });

    await auditRepository.create({
      actorId: owner.id,
      actorEmail: owner.email,
      actorRole: owner.role,
      action: 'OWNER_AGENT_INVITED',
      objectType: 'RELATIONSHIP',
      objectId: relationship.id,
      result: 'SUCCESS',
      metadata: {
        agentId: agent.id,
        agentEmail: agent.email,
        mandateType: data.mandateType,
      },
    });

    // Notify agent
    await notificationService.createNotification(agent.id, {
      title: 'Representation Invitation Received',
      message: `${owner.name} invited you to represent their properties under a ${data.mandateType} mandate.`,
      type: 'SYSTEM',
      link: '/dashboard',
    });

    return relationship;
  }

  /**
   * Agent accepts or declines an invitation
   */
  async respondToInvitation(
    agent: User,
    relationshipId: string,
    action: 'ACCEPT' | 'REJECT',
    notes?: string
  ): Promise<OwnerAgentRelationship> {
    const rel = await relationshipRepository.findById(relationshipId);
    if (!rel) throw new Error('Representation relationship not found.');

    if (rel.agentId !== agent.id && agent.role !== 'ADMIN') {
      throw new Error('Unauthorized: You are not the invited agent for this mandate.');
    }

    if (rel.status !== 'INVITED') {
      throw new Error(`Cannot respond to relationship in status: ${rel.status}`);
    }

    const now = new Date().toISOString();
    const newStatus = action === 'ACCEPT' ? 'ACTIVE' : 'REJECTED';

    const updated = await relationshipRepository.update(relationshipId, {
      status: newStatus,
      respondedAt: now,
      notes: notes ? `${rel.notes ? rel.notes + ' | ' : ''}Agent response: ${notes}` : rel.notes,
    });

    await auditRepository.create({
      actorId: agent.id,
      actorEmail: agent.email,
      actorRole: agent.role,
      action: action === 'ACCEPT' ? 'OWNER_AGENT_ACCEPTED' : 'OWNER_AGENT_REJECTED',
      objectType: 'RELATIONSHIP',
      objectId: relationshipId,
      result: 'SUCCESS',
      metadata: { action, ownerId: rel.ownerId },
    });

    // Notify owner
    await notificationService.createNotification(rel.ownerId, {
      title: action === 'ACCEPT' ? 'Mandate Accepted' : 'Mandate Declined',
      message: `Agent ${agent.name} has ${action === 'ACCEPT' ? 'accepted' : 'declined'} your representation invitation.`,
      type: 'SYSTEM',
      link: '/dashboard',
    });

    return updated!;
  }

  /**
   * Owner revokes access. Security rule: Agents must NOT be able to revoke the owner's authority!
   */
  async revokeRelationship(
    user: User,
    relationshipId: string,
    reason?: string
  ): Promise<OwnerAgentRelationship> {
    const rel = await relationshipRepository.findById(relationshipId);
    if (!rel) throw new Error('Representation relationship not found.');

    // Security rule: Only the property owner or Admin can revoke an agent's mandate. Agents cannot revoke owners.
    if (rel.ownerId !== user.id && user.role !== 'ADMIN') {
      throw new Error('Forbidden: Only the property owner or administrator can revoke representation authority.');
    }

    if (rel.status === 'REVOKED') {
      throw new Error('Relationship is already revoked.');
    }

    const now = new Date().toISOString();
    const updated = await relationshipRepository.update(relationshipId, {
      status: 'REVOKED',
      revokedAt: now,
      revokedBy: user.id,
      notes: reason ? `${rel.notes ? rel.notes + ' | ' : ''}Revocation reason: ${reason}` : rel.notes,
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'OWNER_AGENT_REVOKED',
      objectType: 'RELATIONSHIP',
      objectId: relationshipId,
      result: 'SUCCESS',
      metadata: { revokedBy: user.id, reason },
    });

    // Notify agent
    await notificationService.createNotification(rel.agentId, {
      title: 'Representation Authority Revoked',
      message: `${rel.ownerName} has revoked your mandate for their property listings.`,
      type: 'SYSTEM',
      link: '/dashboard',
    });

    return updated!;
  }

  /**
   * Validates if an agent has legal active authority to manage or act upon a property
   */
  async validateAgentAuthority(agentId: string, property: Property): Promise<boolean> {
    // 1. Direct agent listing (agent owns or listed directly as sole principal)
    if (property.ownerId === agentId) return true;

    // 2. Explicit active mandate relationship between owner and agent
    const activeRel = await relationshipRepository.findActiveRelationship(property.ownerId, agentId);
    if (!activeRel) return false;

    // If mandate has specific propertyIds listed, verify property is included
    if (activeRel.propertyIds && activeRel.propertyIds.length > 0) {
      return activeRel.propertyIds.includes(property.id);
    }

    return true;
  }

  /**
   * Transparent audit and activity history of agent management on owner's properties.
   */
  async getAgentActivityForOwner(
    owner: User,
    propertyId?: string
  ): Promise<{
    relationships: OwnerAgentRelationship[];
    activities: {
      id: string;
      timestamp: string;
      activityType: 'INSPECTION' | 'ENQUIRY' | 'APPLICATION' | 'LISTING_MUTATION' | 'MANDATE_CHANGE';
      propertyId?: string;
      propertyTitle?: string;
      agentId: string;
      agentName: string;
      description: string;
      details?: Record<string, any>;
    }[];
  }> {
    if (owner.role !== 'OWNER' && owner.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only property owners or administrators can view agent management history.');
    }

    const { propertyRepository } = await import('../repositories/property-repository');
    const { inspectionRepository } = await import('../repositories/inspection-repository');
    const { enquiryRepository } = await import('../repositories/enquiry-repository');

    const relationships = await relationshipRepository.findByOwner(owner.id);
    const agentIds = new Set(relationships.map((r) => r.agentId));

    const ownerProperties = await propertyRepository.findByOwner(owner.id);
    const targetProperties = propertyId
      ? ownerProperties.filter((p) => p.id === propertyId)
      : ownerProperties;
    const targetPropIds = new Set(targetProperties.map((p) => p.id));
    const propMap = new Map(ownerProperties.map((p) => [p.id, p.title]));

    const activities: {
      id: string;
      timestamp: string;
      activityType: 'INSPECTION' | 'ENQUIRY' | 'APPLICATION' | 'LISTING_MUTATION' | 'MANDATE_CHANGE';
      propertyId?: string;
      propertyTitle?: string;
      agentId: string;
      agentName: string;
      description: string;
      details?: Record<string, any>;
    }[] = [];

    // 1. Mandate relationship activities
    for (const rel of relationships) {
      if (propertyId && rel.propertyIds && rel.propertyIds.length > 0 && !rel.propertyIds.includes(propertyId)) {
        continue;
      }
      activities.push({
        id: `act_${rel.id}_invite`,
        timestamp: rel.invitedAt,
        activityType: 'MANDATE_CHANGE',
        agentId: rel.agentId,
        agentName: rel.agentName,
        description: `Owner invited agent for ${rel.mandateType} mandate (Status: ${rel.status}).`,
        details: { mandateType: rel.mandateType, commissionRate: rel.commissionRate },
      });
      if (rel.respondedAt && rel.status === 'ACTIVE') {
        activities.push({
          id: `act_${rel.id}_accept`,
          timestamp: rel.respondedAt,
          activityType: 'MANDATE_CHANGE',
          agentId: rel.agentId,
          agentName: rel.agentName,
          description: `Agent accepted mandate and assumed authorized representation.`,
          details: { notes: rel.notes },
        });
      }
      if (rel.revokedAt) {
        activities.push({
          id: `act_${rel.id}_revoke`,
          timestamp: rel.revokedAt,
          activityType: 'MANDATE_CHANGE',
          agentId: rel.agentId,
          agentName: rel.agentName,
          description: `Representation mandate was revoked.`,
          details: { notes: rel.notes },
        });
      }
    }

    // 2. Inspection activities handled by agents on owner properties
    const allInspections = await inspectionRepository.listAll();
    for (const insp of allInspections) {
      if (targetPropIds.has(insp.propertyId) && agentIds.has(insp.hostId)) {
        const agentRel = relationships.find((r) => r.agentId === insp.hostId);
        activities.push({
          id: `act_insp_${insp.id}`,
          timestamp: insp.updatedAt,
          activityType: 'INSPECTION',
          propertyId: insp.propertyId,
          propertyTitle: insp.propertyTitle,
          agentId: insp.hostId,
          agentName: agentRel?.agentName || 'Authorized Agent',
          description: `Agent managed inspection (${insp.status}) for ${insp.seekerName}.`,
          details: { inspectionType: insp.type, date: insp.preferredDate, record: insp.inspectionRecord },
        });
      }
    }

    // 3. Enquiry message activities replied by agents on owner properties
    const allEnquiries = await enquiryRepository.listAll();
    for (const enq of allEnquiries) {
      if (
        targetPropIds.has(enq.propertyId) &&
        (agentIds.has(enq.hostId) || (enq.authorizedAgentId && agentIds.has(enq.authorizedAgentId)))
      ) {
        const agentId = enq.authorizedAgentId || enq.hostId;
        const agentRel = relationships.find((r) => r.agentId === agentId);
        const agentMessages = enq.messages.filter((m) => m.senderId === agentId);
        for (const msg of agentMessages) {
          activities.push({
            id: `act_msg_${msg.id}`,
            timestamp: msg.timestamp,
            activityType: 'ENQUIRY',
            propertyId: enq.propertyId,
            propertyTitle: enq.propertyTitle,
            agentId,
            agentName: agentRel?.agentName || msg.senderName,
            description: `Agent responded to seeker inquiry: "${msg.text.slice(0, 60)}..."`,
            details: { seekerName: enq.seekerName },
          });
        }
      }
    }

    // 4. Audit logs for listing mutations made by agents
    const allLogs = await auditRepository.listAll(150);
    for (const log of allLogs) {
      if (log.actorRole === 'AGENT' && agentIds.has(log.actorId)) {
        const propId = log.metadata?.propertyId || (log.objectType === 'PROPERTY' ? log.objectId : undefined);
        if (propId && targetPropIds.has(propId)) {
          const agentRel = relationships.find((r) => r.agentId === log.actorId);
          activities.push({
            id: `act_log_${log.id}`,
            timestamp: log.timestamp,
            activityType: 'LISTING_MUTATION',
            propertyId: propId,
            propertyTitle: propMap.get(propId) || 'Owner Property',
            agentId: log.actorId,
            agentName: agentRel?.agentName || log.actorEmail,
            description: `Agent performed action ${log.action} on property.`,
            details: log.metadata,
          });
        }
      }
    }

    // Sort chronologically descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { relationships, activities };
  }
}

export const relationshipService = new RelationshipService();

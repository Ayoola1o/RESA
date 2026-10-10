import { User, AgentCredential, AgentVerificationLevel } from '@/types/prophunta';
import { agentCredentialRepository } from '../repositories/agent-credential-repository';
import { userRepository } from '../repositories/user-repository';
import { auditRepository } from '../repositories/audit-repository';

export class AgentCredentialService {
  async getAgentCredentials(agentId: string): Promise<AgentCredential[]> {
    return agentCredentialRepository.findByAgent(agentId);
  }

  async listAllCredentials(admin: User): Promise<AgentCredential[]> {
    if (admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only administrators can view credential review queues.');
    }
    return agentCredentialRepository.listAll();
  }

  /**
   * Submit agent professional credential or licensing evidence
   */
  async submitCredential(
    agent: User,
    data: {
      level: AgentVerificationLevel;
      credentialType: AgentCredential['credentialType'];
      title: string;
      issuingAuthority: string;
      registrationNumber: string;
      documentUrl?: string;
      fileReference?: string;
      issuedAt?: string;
      expiresAt?: string;
    }
  ): Promise<AgentCredential> {
    if (agent.role !== 'AGENT' && agent.role !== 'ADMIN') {
      throw new Error('Only agents can submit professional credentials.');
    }

    const credential = await agentCredentialRepository.create({
      agentId: agent.id,
      level: data.level,
      credentialType: data.credentialType,
      title: data.title.trim(),
      issuingAuthority: data.issuingAuthority.trim(),
      registrationNumber: data.registrationNumber.trim(),
      documentUrl: data.documentUrl,
      fileReference: data.fileReference || `/secure-vault/credentials/${agent.id}/${data.registrationNumber.replace(/\W+/g, '_')}.pdf`,
      status: 'PENDING',
      issuedAt: data.issuedAt,
      expiresAt: data.expiresAt,
    });

    await auditRepository.create({
      actorId: agent.id,
      actorEmail: agent.email,
      actorRole: agent.role,
      action: 'AGENT_CREDENTIAL_SUBMITTED',
      objectType: 'CREDENTIAL',
      objectId: credential.id,
      result: 'SUCCESS',
      metadata: {
        credentialType: data.credentialType,
        issuingAuthority: data.issuingAuthority,
        registrationNumber: data.registrationNumber,
      },
    });

    return credential;
  }

  /**
   * Admin reviews agent professional credential
   */
  async reviewCredential(
    admin: User,
    credentialId: string,
    status: 'VERIFIED' | 'REJECTED' | 'EXPIRED',
    reviewNotes?: string
  ): Promise<AgentCredential> {
    if (admin.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only administrators can audit agent credentials.');
    }

    const credential = await agentCredentialRepository.findById(credentialId);
    if (!credential) throw new Error('Credential record not found.');

    const now = new Date().toISOString();
    const updated = await agentCredentialRepository.update(credentialId, {
      status,
      reviewedBy: admin.id,
      reviewedAt: now,
      reviewNotes: reviewNotes?.trim(),
    });

    // Calculate upgraded Agent Verification Level based on cumulative verified credentials
    const allAgentCreds = await agentCredentialRepository.findByAgent(credential.agentId);
    const verifiedCreds = allAgentCreds.filter((c) => c.status === 'VERIFIED');

    let highestLevel: AgentVerificationLevel = 'LEVEL_0_UNVERIFIED';

    const hasTier3 = verifiedCreds.some((c) => c.level === 'LEVEL_3_LICENSED_PRACTITIONER');
    const hasTier2 = verifiedCreds.some((c) => c.level === 'LEVEL_2_BUSINESS_REGISTERED');
    const hasTier1 = verifiedCreds.some((c) => c.level === 'LEVEL_1_IDENTITY_VERIFIED');

    if (hasTier3) {
      highestLevel = 'LEVEL_3_LICENSED_PRACTITIONER';
    } else if (hasTier2) {
      highestLevel = 'LEVEL_2_BUSINESS_REGISTERED';
    } else if (hasTier1) {
      highestLevel = 'LEVEL_1_IDENTITY_VERIFIED';
    }

    await userRepository.update(credential.agentId, {
      agentVerificationLevel: highestLevel,
    });

    await auditRepository.create({
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: 'AGENT_CREDENTIAL_REVIEWED',
      objectType: 'CREDENTIAL',
      objectId: credentialId,
      result: 'SUCCESS',
      metadata: { status, highestLevel, reviewNotes },
    });

    return updated!;
  }

  /**
   * Configurable agent verification explanation for seekers and public cards
   */
  getVerificationLevelExplanation(level?: AgentVerificationLevel): {
    title: string;
    description: string;
    badgeLabel: string;
    badgeColor: string;
  } {
    switch (level) {
      case 'LEVEL_3_LICENSED_PRACTITIONER':
        return {
          title: 'Tier 3: Certified Estate Practitioner',
          description:
            'Independently audited regulatory practitioner license or accredited association membership on file (e.g. LASRERA, NIESV, ERCAAN).',
          badgeLabel: 'Licensed Practitioner',
          badgeColor: 'bg-emerald-600 text-white',
        };
      case 'LEVEL_2_BUSINESS_REGISTERED':
        return {
          title: 'Tier 2: Business & Agency Registered',
          description:
            'Corporate Affairs Commission (CAC) business incorporation certificate validated against public registry records.',
          badgeLabel: 'CAC Registered Agency',
          badgeColor: 'bg-blue-600 text-white',
        };
      case 'LEVEL_1_IDENTITY_VERIFIED':
        return {
          title: 'Tier 1: Identity Verified',
          description:
            'Government photo identification (NIN or International Passport) verified with biometric authentication.',
          badgeLabel: 'Identity Verified',
          badgeColor: 'bg-slate-800 text-white',
        };
      default:
        return {
          title: 'Standard Agent Account',
          description:
            'Basic registered account. Professional credentials and regulatory memberships are pending formal submission and audit.',
          badgeLabel: 'Standard Agent',
          badgeColor: 'bg-slate-200 text-slate-700',
        };
    }
  }
}

export const agentCredentialService = new AgentCredentialService();

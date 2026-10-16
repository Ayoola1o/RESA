import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  UserRole,
  Property,
  InspectionRequest,
  PropertyEnquiry,
  Application,
  ListingReport,
  AuditLog,
  AppNotification,
  OwnerAgentRelationship,
  AgentCredential,
  StaffAccount,
  ApprovalRequest,
  UserDocument,
  SeekerHousingPreferences,
} from '@/types/prophunta';
import {
  SEED_USERS,
  SEED_PROPERTIES,
  SEED_INSPECTIONS,
  SEED_ENQUIRIES,
  SEED_APPLICATIONS,
  SEED_REPORTS,
  SEED_AUDIT_LOGS
} from '../seed/initial-data';

export interface DatabaseSchema {
  users: User[];
  passwords: Record<string, string>; // userId -> hashedPassword
  sessions: Record<string, { userId: string; role: UserRole; expiresAt: string }>;
  properties: Property[];
  inspections: InspectionRequest[];
  enquiries: PropertyEnquiry[];
  applications: Application[];
  reports: ListingReport[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  relationships: OwnerAgentRelationship[];
  agentCredentials: AgentCredential[];
  staffAccounts: StaffAccount[];
  approvalRequests: ApprovalRequest[];
  userDocuments: UserDocument[];
  savedPropertyIds: Record<string, string[]>;
  seekerPreferences: Record<string, SeekerHousingPreferences>;
}

import os from 'os';

// In-memory cache representing the database state
let dbCache: DatabaseSchema | null = null;

function getStorePaths() {
  const cwdDir = path.join(process.cwd(), '.data');
  const cwdFile = path.join(cwdDir, 'prophunta-db.json');
  const tmpDir = path.join(os.tmpdir(), 'prophunta-data');
  const tmpFile = path.join(tmpDir, 'prophunta-db.json');
  return { cwdDir, cwdFile, tmpDir, tmpFile };
}

export function hashPassword(plainPassword: string): string {
  return crypto.createHash('sha256').update(plainPassword + '_prophunta_salt_2026').digest('hex');
}

export const SEED_RELATIONSHIPS: OwnerAgentRelationship[] = [
  {
    id: 'rel_seed_1',
    ownerId: 'user_owner_1',
    ownerName: 'Alhaji Ibrahim Danjuma',
    ownerEmail: 'owner@prophunta.ai',
    ownerPhone: '+234 802 987 6543',
    agentId: 'user_agent_1',
    agentName: 'Tunde Adeleke',
    agentEmail: 'agent@prophunta.ai',
    agentPhone: '+234 805 456 7890',
    propertyIds: ['prop-1', 'prop-3'],
    mandateType: 'EXCLUSIVE',
    commissionRate: '5.0%',
    status: 'ACTIVE',
    scope: 'Exclusive marketing and tenant/buyer vetting mandate for Lagos Prime properties.',
    invitedBy: 'OWNER',
    invitedAt: '2026-08-16T10:00:00Z',
    respondedAt: '2026-08-16T12:00:00Z',
    notes: 'Approved authorized representation verified with legal agency agreement on file.',
    createdAt: '2026-08-16T10:00:00Z',
    updatedAt: '2026-08-16T12:00:00Z',
  },
];

export const SEED_AGENT_CREDENTIALS: AgentCredential[] = [
  {
    id: 'cred_seed_1',
    agentId: 'user_agent_1',
    level: 'LEVEL_3_LICENSED_PRACTITIONER',
    credentialType: 'STATE_LICENSE',
    title: 'LASRERA Real Estate Practitioner License',
    issuingAuthority: 'Lagos State Real Estate Regulatory Authority (LASRERA)',
    registrationNumber: 'LASRERA-2024-0891',
    fileReference: '/secure-vault/credentials/lasrera_adeleke.pdf',
    status: 'VERIFIED',
    issuedAt: '2024-01-15T00:00:00Z',
    expiresAt: '2027-01-15T00:00:00Z',
    reviewedBy: 'user_admin_1',
    reviewedAt: '2026-08-10T10:00:00Z',
    reviewNotes: 'Verified against LASRERA official registry database.',
    createdAt: '2026-08-10T08:00:00Z',
  },
  {
    id: 'cred_seed_2',
    agentId: 'user_agent_1',
    level: 'LEVEL_2_BUSINESS_REGISTERED',
    credentialType: 'CAC_CERTIFICATE',
    title: 'Corporate Affairs Commission Incorporation',
    issuingAuthority: 'CAC Nigeria',
    registrationNumber: 'RC-1849204',
    fileReference: '/secure-vault/credentials/cac_adeleke_partners.pdf',
    status: 'VERIFIED',
    issuedAt: '2021-06-20T00:00:00Z',
    reviewedBy: 'user_admin_1',
    reviewedAt: '2026-08-10T10:30:00Z',
    reviewNotes: 'Corporate registration confirmed active on CAC portal.',
    createdAt: '2026-08-10T08:00:00Z',
  },
];

export const SEED_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'staff_super_admin_1',
    userId: 'user_admin_1',
    email: 'admin@prophunta.ai',
    name: 'Amina Bello (Super Admin)',
    roles: ['SUPER_ADMIN'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
    createdAt: '2026-07-01T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'staff_verification_1',
    userId: 'user_admin_verification',
    email: 'verification@prophunta.ai',
    name: 'Ngozi Okonjo (Verification Officer)',
    roles: ['VERIFICATION_OFFICER'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'staff_moderator_1',
    userId: 'user_admin_moderator',
    email: 'moderator@prophunta.ai',
    name: 'Emeka Nwosu (Property Moderator)',
    roles: ['PROPERTY_MODERATOR'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'staff_trust_1',
    userId: 'user_admin_trust',
    email: 'trust@prophunta.ai',
    name: 'Farouk Umar (Trust & Safety)',
    roles: ['TRUST_SAFETY_INVESTIGATOR'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'staff_inspections_1',
    userId: 'user_admin_inspections',
    email: 'inspections@prophunta.ai',
    name: 'Bisi Adeyemi (Inspection Coordinator)',
    roles: ['INSPECTION_COORDINATOR'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'staff_support_1',
    userId: 'user_admin_support',
    email: 'support@prophunta.ai',
    name: 'Fatima Aliyu (User Support)',
    roles: ['USER_SUPPORT_OFFICER'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
    createdAt: '2026-08-20T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'staff_compliance_1',
    userId: 'user_admin_compliance',
    email: 'compliance@prophunta.ai',
    name: 'Kelechi Obi (Compliance Auditor)',
    roles: ['COMPLIANCE_AUDITOR'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    customGrants: [],
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
  {
    id: 'staff_manager_1',
    userId: 'user_admin_staff_manager',
    email: 'staffmanager@prophunta.ai',
    name: 'Tariq Balogun (Staff Manager)',
    roles: ['STAFF_MANAGER'],
    status: 'ACTIVE',
    scope: { scopeType: 'GLOBAL' },
    delegation: {
      canManageStaff: true,
      maxAssignableRoles: ['VERIFICATION_OFFICER', 'PROPERTY_MODERATOR', 'USER_SUPPORT_OFFICER', 'INSPECTION_COORDINATOR'],
      allowedCustomPermissions: ['documents.view_sensitive', 'properties.suspend', 'users.support'],
      prohibitSuperAdminCreation: true,
    },
    customGrants: [],
    createdAt: '2026-09-10T08:00:00Z',
    updatedAt: '2026-10-05T09:00:00Z',
  },
];

function getDefaultDatabase(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('Password123!');
  const passwords: Record<string, string> = {};
  for (const user of SEED_USERS) {
    passwords[user.id] = defaultPasswordHash;
  }
  passwords['user_seeker_unverified'] = defaultPasswordHash;

  return {
    users: [...SEED_USERS],
    passwords,
    sessions: {},
    properties: SEED_PROPERTIES.map((p) => ({ ...p, isDemo: true })),
    inspections: [...SEED_INSPECTIONS],
    enquiries: [...SEED_ENQUIRIES],
    applications: [...SEED_APPLICATIONS],
    reports: [...SEED_REPORTS],
    auditLogs: [...SEED_AUDIT_LOGS],
    notifications: [
      {
        id: 'notif-1',
        userId: 'user_seeker_1',
        title: 'Inspection Scheduled',
        message: 'Your inspection for Admiralty Way Villa is scheduled for Oct 12.',
        type: 'INSPECTION',
        link: '/inspections',
        read: false,
        createdAt: '2026-10-06T10:00:00Z',
      },
      {
        id: 'notif-2',
        userId: 'user_owner_1',
        title: 'New Property Enquiry',
        message: 'Chidi Okonkwo sent a verified enquiry for "The Admiralty Waterfront Villa".',
        type: 'ENQUIRY',
        link: '/messages',
        read: false,
        createdAt: '2026-10-06T12:00:00Z',
      },
    ],
    relationships: [...SEED_RELATIONSHIPS],
    agentCredentials: [...SEED_AGENT_CREDENTIALS],
    staffAccounts: [...SEED_STAFF_ACCOUNTS],
    approvalRequests: [],
    userDocuments: [],
    savedPropertyIds: {},
    seekerPreferences: {},
  };
}

export function resetDatabase(customSeed?: Partial<DatabaseSchema>): DatabaseSchema {
  const fresh = getDefaultDatabase();
  dbCache = { ...fresh, ...customSeed };
  saveDb(dbCache);
  return dbCache;
}

export function getDb(): DatabaseSchema {
  if (dbCache) {
    return dbCache;
  }

  const { cwdFile, tmpFile } = getStorePaths();

  for (const candidateFile of [cwdFile, tmpFile]) {
    try {
      if (fs.existsSync(candidateFile)) {
        const raw = fs.readFileSync(candidateFile, 'utf-8');
        dbCache = JSON.parse(raw);
        if (dbCache && dbCache.users && dbCache.properties) {
          if (!dbCache.notifications) {
            dbCache.notifications = [];
          }
          if (!dbCache.relationships) {
            dbCache.relationships = [...SEED_RELATIONSHIPS];
          }
          if (!dbCache.agentCredentials) {
            dbCache.agentCredentials = [...SEED_AGENT_CREDENTIALS];
          }
          if (!dbCache.staffAccounts) {
            dbCache.staffAccounts = [...SEED_STAFF_ACCOUNTS];
          }
          if (!dbCache.approvalRequests) {
            dbCache.approvalRequests = [];
          }
          if (!dbCache.userDocuments) {
            dbCache.userDocuments = [];
          }
          if (!dbCache.savedPropertyIds) {
            dbCache.savedPropertyIds = {};
          }
          if (!dbCache.seekerPreferences) {
            dbCache.seekerPreferences = {};
          }
          return dbCache;
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Initialize fresh database with seed data
  dbCache = getDefaultDatabase();
  saveDb(dbCache);
  return dbCache;
}

export function saveDb(data: DatabaseSchema): void {
  dbCache = data;
  const { cwdDir, cwdFile, tmpDir, tmpFile } = getStorePaths();
  let written = false;

  // 1. Try writing to process.cwd() .data
  try {
    if (!fs.existsSync(cwdDir)) {
      fs.mkdirSync(cwdDir, { recursive: true });
    }
    fs.writeFileSync(cwdFile, JSON.stringify(data, null, 2), 'utf-8');
    written = true;
  } catch {
    // Read-only filesystem in serverless
  }

  // 2. Also write to os.tmpdir() prophunta-data (or fallback if cwd failed)
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    written = true;
  } catch (err) {
    if (!written) {
      console.warn('[PropHunta DB] Disk write skipped or restricted:', err);
    }
  }
}

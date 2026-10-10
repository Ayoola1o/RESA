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
}

// In-memory cache representing the database state
let dbCache: DatabaseSchema | null = null;
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'prophunta-db.json');

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
        link: '/profile?tab=inspections',
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

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
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
        return dbCache;
      }
    }
  } catch (err) {
    console.warn('[PropHunta DB] Could not read from disk store, initializing default seed store:', err);
  }

  // Initialize fresh database with seed data
  dbCache = getDefaultDatabase();
  saveDb(dbCache);
  return dbCache;
}

export function saveDb(data: DatabaseSchema): void {
  dbCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // In serverless environments where local disk writes might be restricted, in-memory cache preserves state during function lifetime
    console.warn('[PropHunta DB] Disk write skipped or restricted:', err);
  }
}

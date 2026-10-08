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
  AuditLog
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
}

// In-memory cache representing the database state
let dbCache: DatabaseSchema | null = null;
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'prophunta-db.json');

export function hashPassword(plainPassword: string): string {
  return crypto.createHash('sha256').update(plainPassword + '_prophunta_salt_2026').digest('hex');
}

function getDefaultDatabase(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('Password123!');
  const passwords: Record<string, string> = {};
  for (const user of SEED_USERS) {
    passwords[user.id] = defaultPasswordHash;
  }

  return {
    users: [...SEED_USERS],
    passwords,
    sessions: {},
    properties: [...SEED_PROPERTIES],
    inspections: [...SEED_INSPECTIONS],
    enquiries: [...SEED_ENQUIRIES],
    applications: [...SEED_APPLICATIONS],
    reports: [...SEED_REPORTS],
    auditLogs: [...SEED_AUDIT_LOGS]
  };
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

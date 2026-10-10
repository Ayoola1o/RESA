import { PropertyEnquiry, EnquiryMessage, UserRole } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class EnquiryRepository {
  async findById(id: string): Promise<PropertyEnquiry | null> {
    const db = getDb();
    return db.enquiries.find((e) => e.id === id) || null;
  }

  async listAll(): Promise<PropertyEnquiry[]> {
    const db = getDb();
    return [...db.enquiries];
  }

  async findByUser(userId: string): Promise<PropertyEnquiry[]> {
    const db = getDb();
    return db.enquiries.filter(
      (e) =>
        e.seekerId === userId ||
        e.hostId === userId ||
        e.ownerId === userId ||
        e.authorizedAgentId === userId
    );
  }

  async findByPropertyAndSeeker(propertyId: string, seekerId: string): Promise<PropertyEnquiry | null> {
    const db = getDb();
    return db.enquiries.find((e) => e.propertyId === propertyId && e.seekerId === seekerId) || null;
  }

  async create(data: Omit<PropertyEnquiry, 'id'>): Promise<PropertyEnquiry> {
    const db = getDb();
    const id = `enq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newEnquiry: PropertyEnquiry = {
      ...data,
      id,
    };

    db.enquiries.unshift(newEnquiry);
    saveDb(db);
    return newEnquiry;
  }

  async addMessage(
    enquiryId: string,
    message: {
      senderId: string;
      senderName: string;
      senderRole: UserRole;
      text: string;
      hasOffPlatformWarning?: boolean;
      warningNotice?: string;
    }
  ): Promise<PropertyEnquiry | null> {
    const db = getDb();
    const idx = db.enquiries.findIndex((e) => e.id === enquiryId);
    if (idx === -1) return null;

    const enquiry = db.enquiries[idx];
    const now = new Date().toISOString();
    const newMsg: EnquiryMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      text: message.text,
      timestamp: now,
      read: false,
      hasOffPlatformWarning: message.hasOffPlatformWarning,
      warningNotice: message.warningNotice,
    };

    enquiry.messages.push(newMsg);
    enquiry.lastMessageText = message.text;
    enquiry.lastMessageAt = now;
    if (message.hasOffPlatformWarning) {
      enquiry.hasOffPlatformWarning = true;
      enquiry.offPlatformWarningNotice = message.warningNotice;
    }

    if (message.senderId === enquiry.seekerId) {
      enquiry.unreadCountForHost += 1;
    } else {
      enquiry.unreadCountForSeeker += 1;
    }

    saveDb(db);
    return enquiry;
  }

  async markAsRead(enquiryId: string, readerId: string): Promise<void> {
    const db = getDb();
    const idx = db.enquiries.findIndex((e) => e.id === enquiryId);
    if (idx === -1) return;

    const enquiry = db.enquiries[idx];
    enquiry.messages.forEach((m) => {
      if (m.senderId !== readerId) {
        m.read = true;
      }
    });

    if (readerId === enquiry.seekerId) {
      enquiry.unreadCountForSeeker = 0;
    } else {
      enquiry.unreadCountForHost = 0;
    }

    saveDb(db);
  }
}

export const enquiryRepository = new EnquiryRepository();

import { User, PropertyEnquiry } from '@/types/prophunta';
import { enquiryRepository } from '../repositories/enquiry-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';

export class EnquiryService {
  async getEnquiry(id: string): Promise<PropertyEnquiry | null> {
    return enquiryRepository.findById(id);
  }

  async getUserEnquiries(user: User): Promise<PropertyEnquiry[]> {
    if (user.role === 'ADMIN') {
      return enquiryRepository.listAll();
    }
    return enquiryRepository.findByUser(user.id);
  }

  async sendEnquiry(user: User, propertyId: string, initialMessage: string): Promise<PropertyEnquiry> {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const hostId = property.authorizedAgentId || property.ownerId;
    let existing = await enquiryRepository.findByPropertyAndSeeker(propertyId, user.id);

    if (existing) {
      await enquiryRepository.addMessage(existing.id, {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text: initialMessage,
      });
      return (await enquiryRepository.findById(existing.id))!;
    }

    const now = new Date().toISOString();
    const newEnquiry = await enquiryRepository.create({
      propertyId: property.id,
      propertyTitle: property.title,
      propertyImage: property.media[0]?.url,
      seekerId: user.id,
      seekerName: user.name,
      hostId,
      hostName: property.authorizedAgentId ? 'Authorized Agent' : 'Property Owner',
      lastMessageText: initialMessage,
      lastMessageAt: now,
      unreadCountForSeeker: 0,
      unreadCountForHost: 1,
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          text: initialMessage,
          timestamp: now,
          read: false,
        },
      ],
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ENQUIRY_SENT',
      objectType: 'ENQUIRY',
      objectId: newEnquiry.id,
      result: 'SUCCESS',
      metadata: { propertyId: property.id },
    });

    return newEnquiry;
  }

  async reply(user: User, enquiryId: string, text: string): Promise<PropertyEnquiry> {
    const updated = await enquiryRepository.addMessage(enquiryId, {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text,
    });

    if (!updated) throw new Error('Enquiry not found');
    return updated;
  }

  async markAsRead(user: User, enquiryId: string): Promise<void> {
    await enquiryRepository.markAsRead(enquiryId, user.id);
  }
}

export const enquiryService = new EnquiryService();

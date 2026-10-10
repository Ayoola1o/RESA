import { User, PropertyEnquiry } from '@/types/prophunta';
import { enquiryRepository } from '../repositories/enquiry-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { notificationService } from './notification-service';

export class EnquiryService {
  private attachAliases(enquiry: PropertyEnquiry): PropertyEnquiry {
    return {
      ...enquiry,
      user: {
        id: enquiry.seekerId,
        name: enquiry.seekerName,
        role: 'SEEKER',
      },
      property: {
        id: enquiry.propertyId,
        title: enquiry.propertyTitle,
        image: enquiry.propertyImage,
      },
      timestamp: enquiry.lastMessageAt,
      message: enquiry.lastMessageText,
    };
  }

  async getEnquiry(id: string): Promise<PropertyEnquiry | null> {
    const enquiry = await enquiryRepository.findById(id);
    return enquiry ? this.attachAliases(enquiry) : null;
  }

  async getUserEnquiries(user: User): Promise<PropertyEnquiry[]> {
    let list: PropertyEnquiry[];
    if (user.role === 'ADMIN') {
      list = await enquiryRepository.listAll();
    } else {
      list = await enquiryRepository.findByUser(user.id);
    }
    return list.map((e) => this.attachAliases(e));
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

      // Send notification to host
      await notificationService.createNotification(hostId, {
        title: 'New Property Message',
        message: `${user.name} sent a message regarding "${property.title}": "${initialMessage.slice(0, 60)}..."`,
        type: 'ENQUIRY',
        link: `/messages/${existing.id}`,
      });

      const updated = await enquiryRepository.findById(existing.id);
      return this.attachAliases(updated!);
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
      metadata: { propertyId: property.id, hostId, preview: initialMessage.slice(0, 60) },
    });

    // Notify Host of initial enquiry
    await notificationService.createNotification(hostId, {
      title: 'New Property Enquiry',
      message: `${user.name} enquired about "${property.title}": "${initialMessage.slice(0, 75)}"`,
      type: 'ENQUIRY',
      link: `/messages/${newEnquiry.id}`,
    });

    return this.attachAliases(newEnquiry);
  }

  async reply(user: User, enquiryId: string, text: string): Promise<PropertyEnquiry> {
    const updated = await enquiryRepository.addMessage(enquiryId, {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text,
    });

    if (!updated) throw new Error('Enquiry not found');

    const recipientId = user.id === updated.seekerId ? updated.hostId : updated.seekerId;

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ENQUIRY_SENT',
      objectType: 'ENQUIRY',
      objectId: enquiryId,
      result: 'SUCCESS',
      metadata: { propertyId: updated.propertyId, recipientId, preview: text.slice(0, 60) },
    });

    // Send notification to recipient
    await notificationService.createNotification(recipientId, {
      title: `Message from ${user.name}`,
      message: `Re: "${updated.propertyTitle}": "${text.slice(0, 75)}"`,
      type: 'ENQUIRY',
      link: `/messages/${updated.id}`,
    });

    return this.attachAliases(updated);
  }

  async markAsRead(user: User, enquiryId: string): Promise<void> {
    await enquiryRepository.markAsRead(enquiryId, user.id);
  }
}

export const enquiryService = new EnquiryService();

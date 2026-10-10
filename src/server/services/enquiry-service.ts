import { User, PropertyEnquiry } from '@/types/prophunta';
import { enquiryRepository } from '../repositories/enquiry-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { notificationService } from './notification-service';

export class EnquiryService {
  /**
   * Intelligently scans message content for suspicious off-platform bypass attempts.
   * Note: Adheres to PRD rule to display clear warnings rather than auto-punitive bans.
   */
  detectOffPlatformSolicitation(text: string): { isSuspicious: boolean; warningNotice?: string } {
    const lower = text.toLowerCase();
    const bankPattern = /(?:gtb|zenith|access bank|first bank|uba|kuda|opay|palmpay|fidelity|union bank|stanbic|sterling|wema)\s*(?:account|acct|transfer|wire|pay)/i;
    const directTransferPattern = /(?:send|pay|wire|transfer)\s+(?:money|funds|rent|cash|fee|deposit)\s+(?:directly\s+)?to\s+(?:my|this|personal)\s+(?:account|bank|number)/i;
    const accountNumberPattern = /(?:acct|account)\s*(?:no|num|number)?\s*[:=\s]\s*\d{10}/i;
    const offPlatformChatPattern = /(?:whatsapp|telegram)\s*(?::|at|\+?234|\d{10,11}|me|chat|payment|call|dm|message|\d)/i;
    const bypassFeesPattern = /(?:off[- ]?(?:app|platform|system)|outside\s+(?:the\s+)?(?:platform|system|app|website)|avoid\s+(?:the\s+)?(?:fees?|commission)|skip\s+the\s+website)/i;
    const directPhonePattern = /(?:call|reach|message)\s+(?:me\s+)?(?:on|at|via)\s+(?:\+?234|\d{10,11})/i;

    const isSuspicious =
      bankPattern.test(text) ||
      directTransferPattern.test(text) ||
      accountNumberPattern.test(text) ||
      offPlatformChatPattern.test(text) ||
      bypassFeesPattern.test(lower) ||
      directPhonePattern.test(text);

    if (isSuspicious) {
      return {
        isSuspicious: true,
        warningNotice:
          '⚠️ Off-Platform Safety Notice: Moving transactions, communications, or payments outside PropHunta AI forfeits all independent verification protections, physical inspection dispute records, and title audit guarantees. Never transfer funds to personal bank accounts.',
      };
    }

    return { isSuspicious: false };
  }

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

  async getEnquiry(user: User, id: string): Promise<PropertyEnquiry | null> {
    const enquiry = await enquiryRepository.findById(id);
    if (!enquiry) return null;

    // Server-side authorization check: seeker, owner, authorized agent, host, or admin
    const isParticipant =
      enquiry.seekerId === user.id ||
      enquiry.hostId === user.id ||
      enquiry.ownerId === user.id ||
      enquiry.authorizedAgentId === user.id ||
      user.role === 'ADMIN';

    if (!isParticipant) {
      throw new Error('Unauthorized: You do not have permission to view this conversation.');
    }

    return this.attachAliases(enquiry);
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

    const ownerId = property.ownerId;
    const authorizedAgentId = property.authorizedAgentId;
    const hostId = authorizedAgentId || ownerId;

    // Detect potential off-platform bypass attempt
    const detection = this.detectOffPlatformSolicitation(initialMessage);

    let existing = await enquiryRepository.findByPropertyAndSeeker(propertyId, user.id);

    if (existing) {
      if (!existing.ownerId && ownerId) existing.ownerId = ownerId;
      if (!existing.authorizedAgentId && authorizedAgentId) existing.authorizedAgentId = authorizedAgentId;

      await enquiryRepository.addMessage(existing.id, {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text: initialMessage,
        hasOffPlatformWarning: detection.isSuspicious,
        warningNotice: detection.warningNotice,
      });

      if (detection.isSuspicious) {
        await auditRepository.create({
          actorId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: 'OFF_PLATFORM_WARNING_TRIGGERED',
          objectType: 'ENQUIRY',
          objectId: existing.id,
          result: 'SUCCESS',
          metadata: { preview: initialMessage.slice(0, 80) },
        });
      }

      // Notify host and owner if different
      const recipients = new Set([hostId, ownerId]);
      recipients.delete(user.id);

      for (const recId of recipients) {
        await notificationService.createNotification(recId, {
          title: 'New Property Message',
          message: `${user.name} sent a message regarding "${property.title}": "${initialMessage.slice(0, 60)}..."`,
          type: 'ENQUIRY',
          link: `/messages/${existing.id}`,
        });
      }

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
      hostName: authorizedAgentId ? 'Authorized Agent' : 'Property Owner',
      ownerId,
      authorizedAgentId,
      lastMessageText: initialMessage,
      lastMessageAt: now,
      unreadCountForSeeker: 0,
      unreadCountForHost: 1,
      hasOffPlatformWarning: detection.isSuspicious,
      offPlatformWarningNotice: detection.warningNotice,
      messages: [
        {
          id: `msg_${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          text: initialMessage,
          timestamp: now,
          read: false,
          hasOffPlatformWarning: detection.isSuspicious,
          warningNotice: detection.warningNotice,
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
      metadata: {
        propertyId: property.id,
        ownerId,
        authorizedAgentId,
        hostId,
        preview: initialMessage.slice(0, 60),
        hasOffPlatformWarning: detection.isSuspicious,
      },
    });

    if (detection.isSuspicious) {
      await auditRepository.create({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'OFF_PLATFORM_WARNING_TRIGGERED',
        objectType: 'ENQUIRY',
        objectId: newEnquiry.id,
        result: 'SUCCESS',
        metadata: { preview: initialMessage.slice(0, 80) },
      });
    }

    // Shared Conversation Notification: Notify both owner and agent
    const notifyRecipients = new Set([ownerId]);
    if (authorizedAgentId) notifyRecipients.add(authorizedAgentId);
    notifyRecipients.delete(user.id);

    for (const recId of notifyRecipients) {
      await notificationService.createNotification(recId, {
        title: 'New Property Enquiry',
        message: `${user.name} enquired about "${property.title}": "${initialMessage.slice(0, 75)}"`,
        type: 'ENQUIRY',
        link: `/messages/${newEnquiry.id}`,
      });
    }

    return this.attachAliases(newEnquiry);
  }

  async reply(user: User, enquiryId: string, text: string): Promise<PropertyEnquiry> {
    const enquiry = await enquiryRepository.findById(enquiryId);
    if (!enquiry) throw new Error('Enquiry not found');

    // Server-side authorization check: only seeker, owner, authorized agent, host, or admin can reply
    const isParticipant =
      enquiry.seekerId === user.id ||
      enquiry.hostId === user.id ||
      enquiry.ownerId === user.id ||
      enquiry.authorizedAgentId === user.id ||
      user.role === 'ADMIN';

    if (!isParticipant) {
      throw new Error('Unauthorized: You do not have permission to reply to this conversation.');
    }

    // Detect potential off-platform bypass attempt
    const detection = this.detectOffPlatformSolicitation(text);

    const updated = await enquiryRepository.addMessage(enquiryId, {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text,
      hasOffPlatformWarning: detection.isSuspicious,
      warningNotice: detection.warningNotice,
    });

    if (!updated) throw new Error('Failed to post reply.');

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ENQUIRY_SENT',
      objectType: 'ENQUIRY',
      objectId: enquiryId,
      result: 'SUCCESS',
      metadata: {
        propertyId: updated.propertyId,
        preview: text.slice(0, 60),
        hasOffPlatformWarning: detection.isSuspicious,
      },
    });

    if (detection.isSuspicious) {
      await auditRepository.create({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'OFF_PLATFORM_WARNING_TRIGGERED',
        objectType: 'ENQUIRY',
        objectId: enquiryId,
        result: 'SUCCESS',
        metadata: { preview: text.slice(0, 80) },
      });
    }

    // Multi-party Notification:
    // If seeker replies -> notify owner and agent
    // If agent replies -> notify seeker AND notify owner (so owner sees agent's activity)
    // If owner replies -> notify seeker AND notify agent
    const notifyRecipients = new Set<string>();
    if (user.id === updated.seekerId) {
      if (updated.ownerId) notifyRecipients.add(updated.ownerId);
      if (updated.authorizedAgentId) notifyRecipients.add(updated.authorizedAgentId);
      if (updated.hostId) notifyRecipients.add(updated.hostId);
    } else if (user.id === updated.authorizedAgentId) {
      notifyRecipients.add(updated.seekerId);
      if (updated.ownerId) notifyRecipients.add(updated.ownerId); // Owner transparency!
    } else {
      notifyRecipients.add(updated.seekerId);
      if (updated.authorizedAgentId) notifyRecipients.add(updated.authorizedAgentId);
    }
    notifyRecipients.delete(user.id);

    for (const recId of notifyRecipients) {
      await notificationService.createNotification(recId, {
        title: `Message from ${user.name}`,
        message: `Re: "${updated.propertyTitle}": "${text.slice(0, 75)}"`,
        type: 'ENQUIRY',
        link: `/messages/${updated.id}`,
      });
    }

    return this.attachAliases(updated);
  }

  async markAsRead(user: User, enquiryId: string): Promise<void> {
    await enquiryRepository.markAsRead(enquiryId, user.id);
  }
}

export const enquiryService = new EnquiryService();

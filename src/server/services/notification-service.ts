import { User, AppNotification } from '@/types/prophunta';
import { notificationRepository } from '../repositories/notification-repository';
import { auditRepository } from '../repositories/audit-repository';

export class NotificationService {
  async getUserNotifications(user: User): Promise<AppNotification[]> {
    return notificationRepository.findByUser(user.id);
  }

  async createNotification(
    userId: string,
    data: {
      title: string;
      message: string;
      type: AppNotification['type'];
      link?: string;
    }
  ): Promise<AppNotification> {
    const notif = await notificationRepository.create({
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      read: false,
    });

    await auditRepository.create({
      actorId: 'system',
      actorEmail: 'system@prophunta.ai',
      actorRole: 'ADMIN',
      action: 'NOTIFICATION_SENT',
      objectType: 'USER',
      objectId: userId,
      result: 'SUCCESS',
      metadata: { notificationId: notif.id, type: data.type, title: data.title },
    });

    return notif;
  }

  async markAsRead(user: User, notificationId: string): Promise<boolean> {
    return notificationRepository.markAsRead(notificationId, user.id);
  }

  async markAllAsRead(user: User): Promise<void> {
    return notificationRepository.markAllAsRead(user.id);
  }

  async getUnreadCount(user: User): Promise<number> {
    return notificationRepository.getUnreadCount(user.id);
  }
}

export const notificationService = new NotificationService();

import { AppNotification } from '@/types/prophunta';
import { getDb, saveDb } from '../db/store';

export class NotificationRepository {
  async findByUser(userId: string): Promise<AppNotification[]> {
    const db = getDb();
    if (!db.notifications) return [];
    return db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<AppNotification> {
    const db = getDb();
    if (!db.notifications) db.notifications = [];

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notification: AppNotification = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };

    db.notifications.unshift(notification);
    saveDb(db);
    return notification;
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const db = getDb();
    if (!db.notifications) return false;

    const notif = db.notifications.find((n) => n.id === notificationId && n.userId === userId);
    if (!notif) return false;

    notif.read = true;
    saveDb(db);
    return true;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const db = getDb();
    if (!db.notifications) return;

    db.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    saveDb(db);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const db = getDb();
    if (!db.notifications) return 0;
    return db.notifications.filter((n) => n.userId === userId && !n.read).length;
  }
}

export const notificationRepository = new NotificationRepository();

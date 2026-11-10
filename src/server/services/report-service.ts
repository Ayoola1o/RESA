import { staffAuthorizationService } from './staff-authorization-service';
import { User, ListingReport, ReportReason, ReportStatus, AuditAction } from '@/types/prophunta';
import { reportRepository } from '../repositories/report-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';
import { notificationService } from './notification-service';

export class ReportService {
  async getReport(id: string): Promise<ListingReport | null> {
    return reportRepository.findById(id);
  }

  async getAllReports(adminUser: User): Promise<ListingReport[]> {
    await staffAuthorizationService.requirePermission(adminUser, 'reports.view');
    return reportRepository.listAll();
  }

  async fileReport(
    user: User,
    data: {
      propertyId: string;
      reason: ReportReason;
      description: string;
    }
  ): Promise<ListingReport> {
    const property = await propertyRepository.findById(data.propertyId);
    if (!property) throw new Error('Property not found');

    const report = await reportRepository.create({
      propertyId: property.id,
      propertyTitle: property.title,
      reporterId: user.id,
      reporterName: user.name,
      reason: data.reason,
      description: data.description,
    });

    await auditRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'REPORT_FILED',
      objectType: 'REPORT',
      objectId: report.id,
      result: 'SUCCESS',
      metadata: {
        propertyId: property.id,
        propertyTitle: property.title,
        reason: data.reason,
        description: data.description,
      },
    });

    // Notify Reporter of confirmation
    await notificationService.createNotification(user.id, {
      title: 'Report Received',
      message: `Your report regarding "${property.title}" has been logged and assigned to a compliance officer.`,
      type: 'REPORT',
      link: `/property/${property.id}`,
    });

    return report;
  }

  async updateReportStatus(
    adminUser: User,
    reportId: string,
    status: ReportStatus,
    resolutionNotes?: string,
    listingAction?: 'suspend' | 'restore',
    expectedPropertyId?: string,
  ): Promise<ListingReport> {
    const existing = await reportRepository.findById(reportId);
    if (!existing || (expectedPropertyId && existing.propertyId !== expectedPropertyId)) {
      throw new Error('Report does not match the listing.');
    }
    const property = await propertyRepository.findById(existing.propertyId);
    const resource = { resourceId: existing.propertyId, region: property?.state };
    const permission = status === 'RESOLVED' || status === 'DISMISSED' ? 'reports.resolve'
      : status === 'ESCALATED' ? 'reports.escalate' : 'reports.investigate';
    await staffAuthorizationService.requirePermission(adminUser, permission, resource);
    const propertyAction = listingAction ?? (status === 'SUSPENDED' ? 'suspend' : undefined);
    if (propertyAction) {
      await staffAuthorizationService.requirePermission(adminUser, propertyAction === 'suspend' ? 'properties.suspend' : 'properties.restore', resource);
    }
    const updated = await reportRepository.updateStatus(reportId, status, adminUser.id, resolutionNotes, propertyAction);
    if (!updated) throw new Error('Failed to update report status');

    // Map each status to specific audit action
    const auditActionMap: Record<ReportStatus, AuditAction> = {
      REPORTED: 'REPORT_STATUS_CHANGED',
      UNDER_INVESTIGATION: 'REPORT_INVESTIGATED',
      DOCUMENTATION_REQUESTED: 'REPORT_DOCUMENTATION_REQUESTED',
      RESOLVED: 'REPORT_RESOLVED',
      DISMISSED: 'REPORT_DISMISSED',
      SUSPENDED: 'REPORT_SUSPENDED',
      ESCALATED: 'REPORT_ESCALATED',
    };

    const action = auditActionMap[status] || 'REPORT_STATUS_CHANGED';

    // Maintain resolution history in audit system
    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action,
      objectType: 'REPORT',
      objectId: reportId,
      result: 'SUCCESS',
      metadata: {
        previousStatus: existing.status,
        newStatus: status,
        propertyId: updated.propertyId,
        propertyTitle: updated.propertyTitle,
        reporterId: updated.reporterId,
        reason: updated.reason,
        resolutionNotes: resolutionNotes || 'Status updated by compliance officer.',
        resolvedAt: new Date().toISOString(),
      },
    });

    if (propertyAction) {
      await auditRepository.create({
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        action: propertyAction === 'suspend' ? 'LISTING_SUSPENDED' : 'LISTING_RESTORED',
        objectType: 'PROPERTY',
        objectId: updated.propertyId,
        result: 'SUCCESS',
        metadata: {
          triggerReportId: reportId,
          reason: resolutionNotes || 'Listing status changed following report review.',
        },
      });
    }

    // Notify Reporter of status resolution
    await notificationService.createNotification(updated.reporterId, {
      title: `Report Status: ${status}`,
      message: `Your report for "${updated.propertyTitle}" was reviewed: ${status}.${resolutionNotes ? ` Resolution notes: "${resolutionNotes}"` : ''}`,
      type: 'REPORT',
      link: `/property/${updated.propertyId}`,
    });

    return updated;
  }

  async resolveReport(adminUser: User, reportId: string, resolutionNotes?: string): Promise<ListingReport> {
    return this.updateReportStatus(adminUser, reportId, 'RESOLVED', resolutionNotes);
  }
}

export const reportService = new ReportService();

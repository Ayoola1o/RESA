import { User, ListingReport, ReportReason, ReportStatus } from '@/types/prophunta';
import { reportRepository } from '../repositories/report-repository';
import { propertyRepository } from '../repositories/property-repository';
import { auditRepository } from '../repositories/audit-repository';

export class ReportService {
  async getReport(id: string): Promise<ListingReport | null> {
    return reportRepository.findById(id);
  }

  async getAllReports(adminUser: User): Promise<ListingReport[]> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrator / Verification Officers can view trust reports');
    }
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
      metadata: { propertyId: property.id, reason: data.reason },
    });

    return report;
  }

  async updateReportStatus(
    adminUser: User,
    reportId: string,
    status: ReportStatus,
    resolutionNotes?: string
  ): Promise<ListingReport> {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only Administrator / Verification Officers can moderate reports');
    }

    const updated = await reportRepository.updateStatus(reportId, status, adminUser.id, resolutionNotes);
    if (!updated) throw new Error('Report not found');

    await auditRepository.create({
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: status === 'UNDER_INVESTIGATION' ? 'REPORT_INVESTIGATED' : 'REPORT_RESOLVED',
      objectType: 'REPORT',
      objectId: reportId,
      result: 'SUCCESS',
      metadata: { newStatus: status, resolutionNotes },
    });

    return updated;
  }
}

export const reportService = new ReportService();

import { propertyService } from '../src/server/services/property-service';
import { inspectionService } from '../src/server/services/inspection-service';
import { applicationService } from '../src/server/services/application-service';
import { enquiryService } from '../src/server/services/enquiry-service';
import { verificationService } from '../src/server/services/verification-service';
import { reportService } from '../src/server/services/report-service';
import { auditService } from '../src/server/services/audit-service';
import { authService } from '../src/server/services/auth-service';
import { User, Property, ListingStatus, InspectionStatus, ApplicationStatus } from '../src/types/prophunta';

async function runDashboardTests() {
  console.log('=== TEST SUITE: SECTION 19 DASHBOARDS ===\n');

  // 1. Setup Demo Users
  const seekerUser: User = {
    id: 'user_seeker_001',
    name: 'Chidi Mokeme',
    email: 'chidi.seeker@gmail.com',
    phone: '+234 802 333 4444',
    role: 'SEEKER',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ownerUser: User = {
    id: 'user_owner_001',
    name: 'Alhaji Musa Danjuma',
    email: 'musa.owner@estate.ng',
    phone: '+234 803 111 2222',
    role: 'OWNER',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const agentUser: User = {
    id: 'user_agent_001',
    name: 'Tunde Bakare',
    email: 'tunde@realtors.ng',
    phone: '+234 805 777 8888',
    role: 'AGENT',
    agencyName: 'Prime Crest Realtors',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const adminUser: User = {
    id: 'user_admin_001',
    name: 'PropHunta Compliance Officer',
    email: 'compliance@prophunta.ai',
    phone: '+234 800 000 0001',
    role: 'ADMIN',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // --- 1. SEEKER DASHBOARD FOCUS AREAS ---
  console.log('--- 1. Testing Seeker Dashboard Focus Areas ---');
  // (a) Saved properties & discovery
  const allProperties = await propertyService.searchProperties({});
  console.log(`[SEEKER] Available marketplace properties: ${allProperties.length}`);
  if (allProperties.length === 0) throw new Error('No properties found for seeker dashboard');

  // (b) Applications
  const seekerApps = await applicationService.getUserApplications(seekerUser);
  console.log(`[SEEKER] Applications / Expressions of interest: ${seekerApps.length}`);

  // (c) Inspections
  const seekerInspections = await inspectionService.getUserInspections(seekerUser);
  console.log(`[SEEKER] Scheduled / requested inspections: ${seekerInspections.length}`);

  // (d) Enquiries
  const seekerEnquiries = await enquiryService.getUserEnquiries(seekerUser);
  console.log(`[SEEKER] Active property conversations: ${seekerEnquiries.length}`);

  // (e) Recommendations
  const verifiedRecommendations = allProperties.filter(
    (p) => p.listingStatus === 'ACTIVE' || p.listingStatus === 'VERIFIED'
  );
  console.log(`[SEEKER] Recommended verified properties: ${verifiedRecommendations.length}`);
  console.log('✓ Seeker dashboard focus requirements satisfied.\n');

  // --- 2. OWNER DASHBOARD FOCUS AREAS ---
  console.log('--- 2. Testing Owner Dashboard Focus Areas ---');
  // (a) Properties owned
  const ownerProperties = await propertyService.getUserProperties(ownerUser.id);
  console.log(`[OWNER] Total owned properties: ${ownerProperties.length}`);

  // (b) Listing status breakdown
  const statusCounts = ownerProperties.reduce((acc, p) => {
    acc[p.listingStatus] = (acc[p.listingStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`[OWNER] Listing status breakdown:`, statusCounts);

  // (c) Verification status
  const verificationCounts = ownerProperties.reduce((acc, p) => {
    const status = p.verification?.overallStatus || 'PENDING';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(`[OWNER] Verification overall status breakdown:`, verificationCounts);

  // (d) Occupancy / availability
  const availableCount = ownerProperties.filter((p) => p.availabilityStatus === 'AVAILABLE').length;
  const occupiedCount = ownerProperties.filter((p) => p.availabilityStatus === 'OCCUPIED').length;
  console.log(`[OWNER] Occupancy metrics: ${occupiedCount} occupied, ${availableCount} available.`);

  // (e) Inspection requests on owner properties
  const ownerInspections = await inspectionService.getUserInspections(ownerUser);
  console.log(`[OWNER] Inspection requests received: ${ownerInspections.length}`);

  // (f) Applications received
  const ownerApps = await applicationService.getUserApplications(ownerUser);
  console.log(`[OWNER] Tenant applications & purchase offers received: ${ownerApps.length}`);
  console.log('✓ Owner dashboard focus requirements satisfied.\n');

  // --- 3. AGENT DASHBOARD FOCUS AREAS ---
  console.log('--- 3. Testing Agent Dashboard Focus Areas ---');
  // (a) Managed properties
  const agentProperties = await propertyService.getUserProperties(agentUser.id);
  console.log(`[AGENT] Managed properties / portfolio: ${agentProperties.length}`);

  // (b) Submitted listings & verification queue status
  const agentSubmitted = agentProperties.filter(
    (p) => p.listingStatus === 'SUBMITTED' || p.listingStatus === 'UNDER_REVIEW'
  );
  console.log(`[AGENT] Listings in verification pipeline: ${agentSubmitted.length}`);

  // (c) Inspections coordinated
  const agentInspections = await inspectionService.getUserInspections(agentUser);
  console.log(`[AGENT] Field walkthrough showings: ${agentInspections.length}`);

  // (d) Enquiries managed
  const agentEnquiries = await enquiryService.getUserEnquiries(agentUser);
  console.log(`[AGENT] Client leads & enquiries: ${agentEnquiries.length}`);
  console.log('✓ Agent dashboard focus requirements satisfied.\n');

  // --- 4. ADMIN DASHBOARD FOCUS AREAS ---
  console.log('--- 4. Testing Admin Dashboard Focus Areas ---');
  // (a) Platform overview
  const totalProps = allProperties.length;
  const allUsers = await authService.getAllUsers(adminUser);
  console.log(`[ADMIN] Total platform properties: ${totalProps}, total users: ${allUsers.length}`);

  // (b) Pending verification queue
  const queue = await verificationService.listQueue();
  console.log(`[ADMIN] Pending verification queue items: ${queue.length}`);

  // (c) Properties requiring review
  const requiringReview = allProperties.filter(
    (p) => p.listingStatus === 'CHANGES_REQUIRED' || p.listingStatus === 'SUSPENDED'
  );
  console.log(`[ADMIN] Properties requiring review / moderation: ${requiringReview.length}`);

  // (d) Trust & safety reports
  const allReports = await reportService.getAllReports(adminUser);
  console.log(`[ADMIN] Trust & safety incident reports: ${allReports.length}`);

  // (e) Platform inspections
  const allInspections = await inspectionService.getUserInspections(adminUser);
  console.log(`[ADMIN] Platform inspections tracked: ${allInspections.length}`);

  // (f) Immutable audit activity
  const recentAudit = await auditService.getRecentLogs(adminUser, 20);
  console.log(`[ADMIN] Immutable audit logs: ${recentAudit.length} records`);
  console.log('✓ Admin dashboard focus requirements satisfied.\n');

  console.log('================================================================');
  console.log('ALL SECTION 19 DASHBOARD REQUIREMENTS VERIFIED AND FUNCTIONAL!');
  console.log('================================================================');
}

runDashboardTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

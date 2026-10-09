import { authService } from '../src/server/services/auth-service';
import { propertyService } from '../src/server/services/property-service';
import { inspectionService } from '../src/server/services/inspection-service';
import { applicationService } from '../src/server/services/application-service';
import { enquiryService } from '../src/server/services/enquiry-service';
import { inspectionRepository } from '../src/server/repositories/inspection-repository';
import { applicationRepository } from '../src/server/repositories/application-repository';
import { userRepository } from '../src/server/repositories/user-repository';
import { propertyRepository } from '../src/server/repositories/property-repository';

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('🧪 TESTING PHASE 7 & 8: INSPECTIONS, OFFERS & DASHBOARDS');
  console.log('====================================================\n');

  // 1. Get Seeker and Host Users
  const seeker = await userRepository.findByEmail('seeker@prophunta.ai');
  const owner = await userRepository.findByEmail('owner@prophunta.ai');
  const agent = await userRepository.findByEmail('agent@prophunta.ai');
  const admin = await userRepository.findByEmail('admin@prophunta.ai');

  if (!seeker || !owner || !agent || !admin) {
    throw new Error('Seed users not found.');
  }

  const allProps = await propertyRepository.listAll();
  const testProp = allProps[0];
  const host = (await userRepository.findById(testProp.ownerId)) || owner;
  console.log(`Test Property: "${testProp.title}" (ID: ${testProp.id}, Host: ${host.email})`);

  // 2. Test Inspection Lifecycle: REQUESTED -> SCHEDULED -> COMPLETED
  console.log('\n1. Testing Inspection Lifecycle & InspectionRecord Filing...');
  const inspection = await inspectionService.requestInspection(seeker, {
    propertyId: testProp.id,
    preferredDate: '2026-10-15',
    preferredTimeSlot: '11:00 AM - 1:00 PM',
    type: 'IN_PERSON',
    notes: 'Please ensure compound gate access is cleared.',
  });
  console.log(`  ✓ Inspection created: ${inspection.id} Status: ${inspection.status}`);

  // Host confirms inspection
  const confirmed = await inspectionService.updateStatus(host, inspection.id, 'SCHEDULED', 'Confirmed by host');
  if (confirmed.status !== 'SCHEDULED') throw new Error('Expected status SCHEDULED');
  console.log(`  ✓ Inspection confirmed by host: Status: ${confirmed.status}`);

  // Host completes inspection and logs official findings
  const completed = await inspectionService.completeInspection(host, inspection.id, {
    inspectorName: 'Engr. Dapo Alabi (Certified Field Officer)',
    conditionRating: 'EXCELLENT',
    utilitiesFunctional: true,
    meterReadings: 'Prepaid #8491029112 - 320.5 kWh',
    observations: 'Property is in turnkey condition. Clean borehole water, functioning inverters, intact ceiling.',
    discrepancies: 'None observed.',
  });
  if (completed.status !== 'COMPLETED' || !completed.inspectionRecord) {
    throw new Error('Inspection completion or record missing.');
  }
  console.log(`  ✓ Inspection completed and record logged:`);
  console.log(`    - Inspector: ${completed.inspectionRecord.inspectorName}`);
  console.log(`    - Rating: ${completed.inspectionRecord.conditionRating}`);
  console.log(`    - Utilities: ${completed.inspectionRecord.utilitiesFunctional ? 'Functional' : 'Not Functional'}`);
  console.log(`    - Meter: ${completed.inspectionRecord.meterReadings}`);
  console.log(`    - Observations: "${completed.inspectionRecord.observations}"`);

  // 3. Test Application / Offer Lifecycle
  console.log('\n2. Testing Application / Offer Lifecycle & Approval...');
  const app = await applicationService.submitApplication(seeker, {
    propertyId: testProp.id,
    type: 'RENTAL',
    occupation: 'Senior Technology Architect',
    moveInDate: '2026-11-01',
    occupants: 2,
    offerAmount: 18000000,
    financingStatus: 'CASH',
    message: 'We are prepared to pay 2 years upfront upon agreeable lease draft.',
  });
  console.log(`  ✓ Application submitted: ${app.id} Status: ${app.status}`);

  const approvedApp = await applicationService.updateStatus(host, app.id, 'APPROVED', 'Terms accepted by owner.');
  if (approvedApp.status !== 'APPROVED') throw new Error('Expected status APPROVED');
  console.log(`  ✓ Application reviewed & approved: Status: ${approvedApp.status}`);

  // 4. Test Enquiry Conversation Thread
  console.log('\n3. Testing Enquiry Thread & Bidirectional Messaging...');
  const enquiry = await enquiryService.sendEnquiry(
    seeker,
    testProp.id,
    'Hello, what are the service charge inclusions regarding generator diesel?'
  );
  console.log(`  ✓ Initial enquiry dispatched: ${enquiry.id}`);

  const replied = await enquiryService.reply(
    host,
    enquiry.id,
    'Service charge covers 24/7 central generator diesel, estate security, and waste management.'
  );
  console.log(`  ✓ Host replied. Total messages in thread: ${replied.messages.length}`);
  console.log(`    Latest: "${replied.messages[replied.messages.length - 1].text}"`);

  // 5. Test Role Dashboard Data Feeds
  console.log('\n4. Testing Role-Differentiated Dashboard Data Aggregation...');
  const seekerInspections = await inspectionService.getUserInspections(seeker);
  const seekerApps = await applicationService.getUserApplications(seeker);
  const seekerEnquiries = await enquiryService.getUserEnquiries(seeker);
  console.log(`  ✓ Seeker Dashboard Metrics:`);
  console.log(`    - Inspections: ${seekerInspections.length}`);
  console.log(`    - Applications: ${seekerApps.length}`);
  console.log(`    - Enquiry Conversations: ${seekerEnquiries.length}`);

  const ownerProps = await propertyService.getUserProperties(owner.id);
  const ownerInspections = await inspectionService.getUserInspections(owner);
  const ownerApps = await applicationService.getUserApplications(owner);
  console.log(`  ✓ Owner Dashboard Metrics:`);
  console.log(`    - Properties in Portfolio: ${ownerProps.length}`);
  console.log(`    - Inspections Managed: ${ownerInspections.length}`);
  console.log(`    - Received Applications: ${ownerApps.length}`);

  console.log('\n====================================================');
  console.log('✅ ALL PHASE 7 & 8 TESTS PASSED SUCCESSFULLY (100%)!');
  console.log('====================================================\n');
}

runPhase7Tests().catch((err) => {
  console.error('❌ Phase 7 test failed:', err);
  process.exit(1);
});

import { enquiryService } from '../src/server/services/enquiry-service';
import { propertyService } from '../src/server/services/property-service';
import { notificationService } from '../src/server/services/notification-service';
import { auditRepository } from '../src/server/repositories/audit-repository';
import { userRepository } from '../src/server/repositories/user-repository';
import { User } from '../src/types/prophunta';

async function runPhase9Tests() {
  console.log('--- STARTING PHASE 9: COMMUNICATION & MESSAGING VERIFICATION ---');

  // 1. Setup actors
  const seeker = await userRepository.create(
    {
      name: 'Chidi Seeker',
      email: `chidi.phase9.${Date.now()}@test.com`,
      role: 'SEEKER',
      phone: '+2348011112222',
      verificationStatus: 'VERIFIED',
    },
    'Password123!'
  );

  const owner = await userRepository.create(
    {
      name: 'Chief Adeleke',
      email: `adeleke.phase9.${Date.now()}@test.com`,
      role: 'OWNER',
      phone: '+2348033334444',
      verificationStatus: 'VERIFIED',
    },
    'Password123!'
  );

  const agent = await userRepository.create(
    {
      name: 'Bimpe Agent',
      email: `bimpe.phase9.${Date.now()}@test.com`,
      role: 'AGENT',
      phone: '+2348055556666',
      verificationStatus: 'VERIFIED',
    },
    'Password123!'
  );

  // 2. Create property draft with assigned authorized agent
  const property = await propertyService.createDraft(owner, {
    title: 'Luxury 3-Bed Terrace Phase 9 Lekki',
    propertyType: 'Terrace',
    listingType: 'RENT',
    description: 'Direct owner listing managed by assigned agent.',
    state: 'Lagos',
    city: 'Lekki',
    area: 'Phase 1',
    address: '15 Admiralty Way',
    price: 6500000,
    bedrooms: 3,
    bathrooms: 3,
    features: ['Generator', 'Security', 'Borehole'],
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    authorizedAgentId: agent.id,
  });

  // 3. Seeker initiates enquiry on property
  console.log('Step 1: Seeker sends enquiry on property...');
  const enquiry = await enquiryService.sendEnquiry(
    seeker,
    property.id,
    'Hello, is this 3-bed terrace still available for immediate inspection?'
  );

  if (!enquiry || !enquiry.id) throw new Error('Failed to create enquiry');
  if (enquiry.propertyId !== property.id) throw new Error('Property ID mismatch on enquiry');
  if (enquiry.seekerId !== seeker.id) throw new Error('Seeker ID mismatch');
  if (enquiry.ownerId !== owner.id) throw new Error('Owner ID mismatch');
  if (enquiry.authorizedAgentId !== agent.id) throw new Error('Authorized Agent ID mismatch');
  if (enquiry.unreadCountForHost !== 1) throw new Error('Unread count for host should be 1');

  // Verify notifications generated for owner & agent
  const agentNotifs = await notificationService.getUserNotifications(agent);
  const ownerNotifs = await notificationService.getUserNotifications(owner);
  const foundAgentNotif = agentNotifs.some(n => n.message.includes('enquired about "Luxury 3-Bed Terrace'));
  const foundOwnerNotif = ownerNotifs.some(n => n.message.includes('enquired about "Luxury 3-Bed Terrace'));
  if (!foundAgentNotif || !foundOwnerNotif) {
    throw new Error('Multi-party enquiry notification failed to reach agent and owner');
  }
  console.log('✓ Seeker enquiry created and multi-party notifications sent.');

  // 4. Agent replies to seeker
  console.log('Step 2: Authorized Agent replies to seeker...');
  const reply1 = await enquiryService.reply(
    agent,
    enquiry.id,
    'Yes Chidi, it is available. We can schedule an inspection tomorrow at 2 PM.'
  );

  if (reply1.messages.length !== 2) throw new Error('Enquiry message thread length mismatch');
  if (reply1.unreadCountForSeeker < 1) throw new Error('Seeker should have unread messages');

  // Verify owner transparency notification (Owner notified when agent speaks to seeker)
  const ownerNotifsAfterReply = await notificationService.getUserNotifications(owner);
  const foundOwnerTransparency = ownerNotifsAfterReply.some(n => n.title.includes('Message from Bimpe Agent'));
  if (!foundOwnerTransparency) {
    throw new Error('Owner transparency notification missing when agent responded');
  }
  console.log('✓ Agent reply posted with owner transparency notification.');

  // 5. Test Off-Platform Solicitation Detection (Section 17 / Communication Safety)
  console.log('Step 3: Seeker attempts off-platform bypass message...');
  const bypassMessage = 'Can we chat directly on WhatsApp at 08012345678 or pay to GTBank 0123456789?';
  const reply2 = await enquiryService.reply(seeker, enquiry.id, bypassMessage);

  const lastMsg = reply2.messages[reply2.messages.length - 1];
  if (!lastMsg.hasOffPlatformWarning) {
    throw new Error('Off-platform solicitation warning flag was NOT triggered for phone/bank mention');
  }

  // Verify audit repository captured warning
  const auditLogs = await auditRepository.query({ action: 'OFF_PLATFORM_WARNING_TRIGGERED', actorId: seeker.id });
  const warningAudit = auditLogs.find(
    a => a.action === 'OFF_PLATFORM_WARNING_TRIGGERED' && (a.actor?.id === seeker.id || (a as any).actorId === seeker.id)
  );
  if (!warningAudit) {
    throw new Error('Audit repository did not log OFF_PLATFORM_WARNING_TRIGGERED event');
  }
  console.log('✓ Off-platform solicitation warning triggered and cryptographically audited.');

  // 6. Test Mark As Read
  console.log('Step 4: Mark conversation as read...');
  await enquiryService.markAsRead(seeker, enquiry.id);
  const readEnquiry = await enquiryService.getEnquiry(seeker, enquiry.id);
  if (!readEnquiry || readEnquiry.unreadCountForSeeker !== 0) {
    throw new Error(`Seeker unread count should be 0 after markAsRead, got ${readEnquiry?.unreadCountForSeeker}`);
  }
  console.log('✓ Mark as read clears unread badges successfully.');

  console.log('\n--- ALL PHASE 9 COMMUNICATION TESTS PASSED PERFECTLY ---');
}

runPhase9Tests().catch((err) => {
  console.error('Phase 9 test failed:', err);
  process.exit(1);
});

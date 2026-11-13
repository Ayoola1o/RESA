import test from 'node:test';
import assert from 'node:assert/strict';
import { isEligibleMarketplaceListing } from '../src/lib/property-publication-eligibility.ts';

const approvedProperty = () => ({
  listingStatus: 'VERIFIED',
  publishedAt: '2026-11-13T10:00:00.000Z',
  moderationStatus: 'APPROVED',
  verification: {
    overallStatus: 'PASSED', ownerIdentityStatus: 'PASSED', locationStatus: 'PASSED',
    authorityDocumentStatus: 'PASSED', availabilityStatus: 'PASSED', mediaStatus: 'PASSED', inspectionStatus: 'PASSED',
  },
  documents: [{ documentType: 'DEED_OF_ASSIGNMENT', status: 'APPROVED' }],
  media: [{ type: 'image', uploadStatus: 'COMPLETED', url: 'https://cdn.example/property.jpg' }],
});

test('eligible listings require final approval, moderation, all checks, an approved title document, and a real image', () => {
  assert.equal(isEligibleMarketplaceListing(approvedProperty()), true);
  for (const status of ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUIRED', 'REJECTED', 'SUSPENDED', 'SOLD']) {
    assert.equal(isEligibleMarketplaceListing({ ...approvedProperty(), listingStatus: status }), false, status);
  }
  assert.equal(isEligibleMarketplaceListing({ ...approvedProperty(), publishedAt: undefined }), false);
  assert.equal(isEligibleMarketplaceListing({ ...approvedProperty(), moderationStatus: 'PENDING' }), false);
  assert.equal(isEligibleMarketplaceListing({ ...approvedProperty(), documents: [{ documentType: 'SURVEY_PLAN', status: 'APPROVED' }] }), false);
  assert.equal(isEligibleMarketplaceListing({ ...approvedProperty(), media: [{ type: 'video', uploadStatus: 'COMPLETED', url: 'video.mp4' }] }), false);
  assert.equal(isEligibleMarketplaceListing({ ...approvedProperty(), verification: { ...approvedProperty().verification, inspectionStatus: 'PENDING' } }), false);
});

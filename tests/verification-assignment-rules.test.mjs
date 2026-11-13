import test from 'node:test';
import assert from 'node:assert/strict';
import { isEligibleAssignee, selectLeastLoadedAssignee } from '../src/lib/verification-assignment-rules.ts';

test('assignment respects role, active status, region, and assigned-only scope', () => {
  const officer = { userId: 'officer-1', status: 'ACTIVE', roles: ['VERIFICATION_OFFICER'], scope: { scopeType: 'REGIONAL', region: 'Lagos' } };
  assert.equal(isEligibleAssignee(officer, 'VERIFICATION_OFFICER', 'Lagos', 'prop-1'), true);
  assert.equal(isEligibleAssignee(officer, 'VERIFICATION_OFFICER', 'Abuja', 'prop-1'), false);
  assert.equal(isEligibleAssignee({ ...officer, status: 'SUSPENDED' }, 'VERIFICATION_OFFICER', 'Lagos', 'prop-1'), false);
  assert.equal(isEligibleAssignee(officer, 'PROPERTY_MODERATOR', 'Lagos', 'prop-1'), false);
  assert.equal(isEligibleAssignee({ ...officer, scope: { scopeType: 'ASSIGNED_ONLY', assignedResourceIds: ['prop-1'] } }, 'VERIFICATION_OFFICER', 'Lagos', 'prop-1'), true);
  assert.equal(isEligibleAssignee({ ...officer, scope: { scopeType: 'ASSIGNED_ONLY', assignedResourceIds: [] } }, 'VERIFICATION_OFFICER', 'Lagos', 'prop-1'), false);
});

test('assignment chooses the least-loaded eligible officer with deterministic ties', () => {
  const candidates = [
    { userId: 'officer-b', status: 'ACTIVE', roles: ['VERIFICATION_OFFICER'], scope: { scopeType: 'GLOBAL' } },
    { userId: 'officer-a', status: 'ACTIVE', roles: ['VERIFICATION_OFFICER'], scope: { scopeType: 'GLOBAL' } },
  ];
  assert.equal(selectLeastLoadedAssignee(candidates, new Map([['officer-a', 3], ['officer-b', 1]])).userId, 'officer-b');
  assert.equal(selectLeastLoadedAssignee(candidates, new Map()).userId, 'officer-a');
});

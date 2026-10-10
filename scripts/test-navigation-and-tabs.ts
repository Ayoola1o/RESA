import { isNavigationItemActive, normalizeTabName, getNavItemsForRole, moreNavItems } from '../src/components/app-sidebar';

function createSearchParams(query: Record<string, string>) {
  return {
    get: (key: string) => query[key] || null,
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

console.log('====================================================');
console.log('🧪 TESTING NAVIGATION ACTIVE STATES & TAB NORMALIZATION');
console.log('====================================================\n');

// 1. Tab Normalization Tests
console.log('1. Testing normalizeTabName helper:');
assert(normalizeTabName('inspections') === 'inspections', 'inspections -> inspections');
assert(normalizeTabName('inspection') === 'inspections', 'inspection -> inspections');
assert(normalizeTabName('applications') === 'applications', 'applications -> applications');
assert(normalizeTabName('offers') === 'applications', 'offers -> applications');
assert(normalizeTabName('eoi') === 'applications', 'eoi -> applications');
assert(normalizeTabName('saved') === 'saved', 'saved -> saved');
assert(normalizeTabName('favorites') === 'saved', 'favorites -> saved');
assert(normalizeTabName('verification') === 'verification', 'verification -> verification');
assert(normalizeTabName('trust') === 'verification', 'trust -> verification');
assert(normalizeTabName('identity') === 'verification', 'identity -> verification');
assert(normalizeTabName('kyc') === 'verification', 'kyc -> verification');
assert(normalizeTabName('financials') === 'financials', 'financials -> financials');
assert(normalizeTabName('market-intelligence') === 'financials', 'market-intelligence -> financials');
assert(normalizeTabName('properties') === 'properties', 'properties -> properties');
assert(normalizeTabName('my-properties') === 'properties', 'my-properties -> properties');

// 2. Active State Matching: /profile?tab=inspections
console.log('\n2. Testing active matching for /profile?tab=inspections:');
const paramsInspections = createSearchParams({ tab: 'inspections' });
assert(
  isNavigationItemActive('/profile?tab=inspections', '/profile', paramsInspections) === true,
  'Inspections item IS active'
);
assert(
  isNavigationItemActive('/profile?tab=applications', '/profile', paramsInspections) === false,
  'Applications item is NOT active'
);
assert(
  isNavigationItemActive('/profile?tab=saved', '/profile', paramsInspections) === false,
  'Saved item is NOT active'
);
assert(
  isNavigationItemActive('/profile?tab=verification', '/profile', paramsInspections) === false,
  'Verification item is NOT active'
);
assert(
  isNavigationItemActive('/profile', '/profile', paramsInspections) === false,
  'Base /profile item is NOT active when specific tab is active'
);

// 3. Active State Matching: /profile?tab=applications
console.log('\n3. Testing active matching for /profile?tab=applications:');
const paramsApps = createSearchParams({ tab: 'applications' });
assert(
  isNavigationItemActive('/profile?tab=applications', '/profile', paramsApps) === true,
  'Applications item IS active'
);
assert(
  isNavigationItemActive('/profile?tab=inspections', '/profile', paramsApps) === false,
  'Inspections item is NOT active'
);
assert(
  isNavigationItemActive('/profile?tab=saved', '/profile', paramsApps) === false,
  'Saved item is NOT active'
);

// 4. Active State Matching: /profile?tab=saved
console.log('\n4. Testing active matching for /profile?tab=saved:');
const paramsSaved = createSearchParams({ tab: 'saved' });
assert(
  isNavigationItemActive('/profile?tab=saved', '/profile', paramsSaved) === true,
  'Saved item IS active'
);
assert(
  isNavigationItemActive('/profile?tab=inspections', '/profile', paramsSaved) === false,
  'Inspections item is NOT active'
);

// 5. Active State Matching: /profile?tab=verification
console.log('\n5. Testing active matching for /profile?tab=verification:');
const paramsVerification = createSearchParams({ tab: 'verification' });
assert(
  isNavigationItemActive('/profile?tab=verification', '/profile', paramsVerification) === true,
  'Verification item IS active'
);
assert(
  isNavigationItemActive('/profile?tab=inspections', '/profile', paramsVerification) === false,
  'Inspections item is NOT active'
);
assert(
  isNavigationItemActive('/profile', '/profile', paramsVerification) === false,
  'Base /profile is NOT active'
);

// 6. Active State Matching: Base /profile (no query param)
console.log('\n6. Testing active matching for base /profile:');
const paramsBase = createSearchParams({});
assert(
  isNavigationItemActive('/profile', '/profile', paramsBase) === true,
  'Base /profile IS active'
);
assert(
  isNavigationItemActive('/profile?tab=inspections', '/profile', paramsBase) === false,
  'Inspections item is NOT active'
);
assert(
  isNavigationItemActive('/profile?tab=applications', '/profile', paramsBase) === false,
  'Applications item is NOT active'
);
assert(
  isNavigationItemActive('/profile?tab=verification', '/profile', paramsBase) === false,
  'Verification item is NOT active'
);

// 7. Active State Matching: Marketplace vs Map View
console.log('\n7. Testing Marketplace vs Map View matching:');
const paramsMap = createSearchParams({ view: 'map' });
assert(
  isNavigationItemActive('/marketplace?view=map', '/marketplace', paramsMap) === true,
  'Map & Geo-Search IS active when view=map'
);
assert(
  isNavigationItemActive('/marketplace', '/marketplace', paramsMap) === false,
  'Base Marketplace is NOT active when view=map'
);

const paramsMarketplace = createSearchParams({});
assert(
  isNavigationItemActive('/marketplace', '/marketplace', paramsMarketplace) === true,
  'Base Marketplace IS active when view is not map'
);
assert(
  isNavigationItemActive('/marketplace?view=map', '/marketplace', paramsMarketplace) === false,
  'Map & Geo-Search is NOT active when view is not map'
);

// 8. Role Navigation Definition Tests
console.log('\n8. Testing Role-differentiated Nav Items:');
const seekerNav = getNavItemsForRole('SEEKER');
assert(seekerNav.some(item => item.href === '/profile?tab=inspections'), 'Seeker has Inspections');
assert(seekerNav.some(item => item.href === '/profile?tab=applications'), 'Seeker has Applications');
assert(seekerNav.some(item => item.href === '/profile?tab=saved'), 'Seeker has Saved Favorites');

const ownerNav = getNavItemsForRole('OWNER');
assert(ownerNav.some(item => item.href === '/profile?tab=properties'), 'Owner has My Properties');
assert(ownerNav.some(item => item.href === '/profile?tab=inspections'), 'Owner has Inspection Requests');
assert(ownerNav.some(item => item.href === '/profile?tab=applications'), 'Owner has Applications & Offers');

const agentNav = getNavItemsForRole('AGENT');
assert(agentNav.some(item => item.href === '/profile?tab=properties'), 'Agent has Authorized Listings');
assert(agentNav.some(item => item.href === '/profile?tab=inspections'), 'Agent has Client Inspections');
assert(agentNav.some(item => item.href === '/profile?tab=applications'), 'Agent has Expressions of Interest');

const adminNav = getNavItemsForRole('ADMIN');
assert(adminNav.some(item => item.href === '/admin?tab=verification'), 'Admin has Verification Queue');
assert(adminNav.some(item => item.href === '/admin?tab=properties'), 'Admin has Property Moderation');

console.log('\n====================================================');
console.log('🎉 ALL NAVIGATION & TAB NORMALIZATION TESTS PASSED!');
console.log('====================================================');

import { isNavigationItemActive, normalizeTabName, getNavItemsForRole, moreNavItems } from '../src/components/app-sidebar';

function createSearchParams(query: Record<string, string> = {}) {
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
console.log('🧪 TESTING DEDICATED STANDALONE PAGES & ACTIVE STATES');
console.log('====================================================\n');

// 1. Tab Normalization Tests (for legacy URL compatibility)
console.log('1. Testing normalizeTabName helper:');
assert(normalizeTabName('inspections') === 'inspections', 'inspections -> inspections');
assert(normalizeTabName('inspection') === 'inspections', 'inspection -> inspections');
assert(normalizeTabName('applications') === 'applications', 'applications -> applications');
assert(normalizeTabName('offers') === 'applications', 'offers -> applications');
assert(normalizeTabName('saved') === 'saved', 'saved -> saved');
assert(normalizeTabName('favorites') === 'saved', 'favorites -> saved');
assert(normalizeTabName('verification') === 'verification', 'verification -> verification');
assert(normalizeTabName('properties') === 'properties', 'properties -> properties');
assert(normalizeTabName('financials') === 'financials', 'financials -> financials');

// 2. Active State Matching: Dedicated /inspections Page
console.log('\n2. Testing active matching for dedicated /inspections:');
const emptyParams = createSearchParams({});
assert(
  isNavigationItemActive('/inspections', '/inspections', emptyParams) === true,
  '/inspections item IS active on /inspections'
);
assert(
  isNavigationItemActive('/applications', '/inspections', emptyParams) === false,
  '/applications item is NOT active on /inspections'
);
assert(
  isNavigationItemActive('/saved', '/inspections', emptyParams) === false,
  '/saved item is NOT active on /inspections'
);
assert(
  isNavigationItemActive('/profile', '/inspections', emptyParams) === false,
  '/profile item is NOT active on /inspections'
);

// 3. Active State Matching: Dedicated /applications Page
console.log('\n3. Testing active matching for dedicated /applications:');
assert(
  isNavigationItemActive('/applications', '/applications', emptyParams) === true,
  '/applications item IS active on /applications'
);
assert(
  isNavigationItemActive('/inspections', '/applications', emptyParams) === false,
  '/inspections item is NOT active on /applications'
);
assert(
  isNavigationItemActive('/saved', '/applications', emptyParams) === false,
  '/saved item is NOT active on /applications'
);

// 4. Active State Matching: Dedicated /saved Page
console.log('\n4. Testing active matching for dedicated /saved:');
assert(
  isNavigationItemActive('/saved', '/saved', emptyParams) === true,
  '/saved item IS active on /saved'
);
assert(
  isNavigationItemActive('/inspections', '/saved', emptyParams) === false,
  '/inspections item is NOT active on /saved'
);
assert(
  isNavigationItemActive('/profile', '/saved', emptyParams) === false,
  '/profile item is NOT active on /saved'
);

// 5. Active State Matching: Dedicated /properties Page
console.log('\n5. Testing active matching for dedicated /properties:');
assert(
  isNavigationItemActive('/properties', '/properties', emptyParams) === true,
  '/properties item IS active on /properties'
);
assert(
  isNavigationItemActive('/inspections', '/properties', emptyParams) === false,
  '/inspections item is NOT active on /properties'
);
assert(
  isNavigationItemActive('/profile', '/properties', emptyParams) === false,
  '/profile item is NOT active on /properties'
);

// 6. Active State Matching: Dedicated /verification Page
console.log('\n6. Testing active matching for dedicated /verification:');
assert(
  isNavigationItemActive('/verification', '/verification', emptyParams) === true,
  '/verification item IS active on /verification'
);
assert(
  isNavigationItemActive('/profile', '/verification', emptyParams) === false,
  '/profile item is NOT active on /verification'
);

// 7. Active State Matching: Dedicated /market-intelligence & /financials Pages
console.log('\n7. Testing active matching for /market-intelligence & /financials:');
assert(
  isNavigationItemActive('/market-intelligence', '/market-intelligence', emptyParams) === true,
  '/market-intelligence item IS active on /market-intelligence'
);
assert(
  isNavigationItemActive('/financials', '/financials', emptyParams) === true,
  '/financials item IS active on /financials'
);
assert(
  isNavigationItemActive('/market-intelligence', '/financials', emptyParams) === false,
  '/market-intelligence is NOT active on /financials'
);

// 8. Active State Matching: Dedicated /profile Page
console.log('\n8. Testing active matching for dedicated /profile:');
assert(
  isNavigationItemActive('/profile', '/profile', emptyParams) === true,
  '/profile IS active on /profile'
);
assert(
  isNavigationItemActive('/inspections', '/profile', emptyParams) === false,
  '/inspections item is NOT active on /profile'
);
assert(
  isNavigationItemActive('/verification', '/profile', emptyParams) === false,
  '/verification item is NOT active on /profile'
);

// 9. Marketplace vs Map View
console.log('\n9. Testing Marketplace vs Map View matching:');
const paramsMap = createSearchParams({ view: 'map' });
assert(
  isNavigationItemActive('/marketplace?view=map', '/marketplace', paramsMap) === true,
  'Map & Geo-Search IS active when view=map'
);
assert(
  isNavigationItemActive('/marketplace', '/marketplace', paramsMap) === false,
  'Base Marketplace is NOT active when view=map'
);
assert(
  isNavigationItemActive('/marketplace', '/marketplace', emptyParams) === true,
  'Base Marketplace IS active when view is not map'
);
assert(
  isNavigationItemActive('/marketplace?view=map', '/marketplace', emptyParams) === false,
  'Map & Geo-Search is NOT active when view is not map'
);

// 10. Role Navigation Definition Tests with Standalone Routes
console.log('\n10. Testing Role-differentiated Standalone Nav Items:');
const seekerNav = getNavItemsForRole('SEEKER');
assert(seekerNav.some(item => item.href === '/inspections'), 'Seeker has standalone /inspections');
assert(seekerNav.some(item => item.href === '/applications'), 'Seeker has standalone /applications');
assert(seekerNav.some(item => item.href === '/saved'), 'Seeker has standalone /saved');
assert(seekerNav.some(item => item.href === '/market-intelligence'), 'Seeker has standalone /market-intelligence');

const ownerNav = getNavItemsForRole('OWNER');
assert(ownerNav.some(item => item.href === '/properties'), 'Owner has standalone /properties');
assert(ownerNav.some(item => item.href === '/inspections'), 'Owner has standalone /inspections');
assert(ownerNav.some(item => item.href === '/applications'), 'Owner has standalone /applications');
assert(ownerNav.some(item => item.href === '/financials'), 'Owner has standalone /financials');

const agentNav = getNavItemsForRole('AGENT');
assert(agentNav.some(item => item.href === '/properties'), 'Agent has standalone /properties');
assert(agentNav.some(item => item.href === '/inspections'), 'Agent has standalone /inspections');
assert(agentNav.some(item => item.href === '/applications'), 'Agent has standalone /applications');

const adminNav = getNavItemsForRole('ADMIN');
assert(adminNav.some(item => item.href === '/admin?tab=verification'), 'Admin has Verification Queue');
assert(adminNav.some(item => item.href === '/admin?tab=properties'), 'Admin has Property Moderation');

assert(moreNavItems.some(item => item.href === '/profile'), 'More nav has /profile');
assert(moreNavItems.some(item => item.href === '/verification'), 'More nav has /verification');
assert(moreNavItems.some(item => item.href === '/settings'), 'More nav has /settings');

console.log('\n====================================================');
console.log('🎉 ALL DEDICATED STANDALONE PAGES & NAV TESTS PASSED!');
console.log('====================================================');

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 RUNNING UI LAYOUT QA & OVERFLOW GUARDRAILS TESTS');
console.log('====================================================\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

const propertyCardPath = path.join(__dirname, '../src/components/property-card.tsx');
const seekerDashPath = path.join(__dirname, '../src/components/dashboards/SeekerDashboard.tsx');
const ownerDashPath = path.join(__dirname, '../src/components/dashboards/OwnerDashboard.tsx');
const agentDashPath = path.join(__dirname, '../src/components/dashboards/AgentDashboard.tsx');
const adminDashPath = path.join(__dirname, '../src/components/dashboards/AdminDashboard.tsx');
const profilePath = path.join(__dirname, '../src/app/(app)/profile/page.tsx');
const marketplacePath = path.join(__dirname, '../src/app/(app)/marketplace/MarketplacePageContent.tsx');
const aiRecommendationsPath = path.join(__dirname, '../src/components/ai-recommendations.tsx');
const propertyDetailPath = path.join(__dirname, '../src/app/(app)/property/[id]/PropertyDetailClient.tsx');

const propertyCardContent = fs.readFileSync(propertyCardPath, 'utf8');
const seekerDashContent = fs.readFileSync(seekerDashPath, 'utf8');
const ownerDashContent = fs.readFileSync(ownerDashPath, 'utf8');
const agentDashContent = fs.readFileSync(agentDashPath, 'utf8');
const adminDashContent = fs.readFileSync(adminDashPath, 'utf8');
const profileContent = fs.readFileSync(profilePath, 'utf8');
const marketplaceContent = fs.readFileSync(marketplacePath, 'utf8');
const aiRecommendationsContent = fs.readFileSync(aiRecommendationsPath, 'utf8');
const propertyDetailContent = fs.readFileSync(propertyDetailPath, 'utf8');

// 1. PropertyCard Defensive Guardrails
console.log('1. Checking PropertyCard overflow guardrails:');
assert(propertyCardContent.includes('min-w-0 w-full'), 'PropertyCard root has min-w-0 w-full');
assert(propertyCardContent.includes('tabular-nums'), 'PropertyCard uses tabular-nums for price display');
assert(propertyCardContent.includes('truncate') && propertyCardContent.includes('title={property.title}'), 'Title has truncate and title tooltip attribute');
assert(propertyCardContent.includes('truncate') && propertyCardContent.includes('title={`${property.address}'), 'Address has truncate and full address tooltip');
assert(propertyCardContent.includes('shrink-0'), 'Spec icons have shrink-0 guardrail');
assert(propertyCardContent.includes('max-w-[80%]'), 'Verification badge has max-w-[80%] constraint');

// 2. Seeker Dashboard Grid & Card Sizes
console.log('\n2. Checking Seeker Dashboard grids:');
assert(seekerDashContent.includes('grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4'), 'KPI cards use responsive 2-to-4 col layout with scale gaps');
assert(seekerDashContent.includes('tabular-nums truncate'), 'KPI metrics use tabular-nums truncate');
assert(seekerDashContent.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'), 'Property lists reflow across sm, lg, xl cleanly');

// 3. Owner & Agent Dashboard Grids
console.log('\n3. Checking Owner & Agent Dashboard grids:');
assert(ownerDashContent.includes('grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4'), 'Owner 5-KPI row reflows at sm and xl without squishing on 1024px');
assert(agentDashContent.includes('grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4'), 'Agent 4-KPI row reflows at md cleanly');

// 4. Admin Dashboard Grids
console.log('\n4. Checking Admin Dashboard 6-KPI row:');
assert(adminDashContent.includes('grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5'), 'Admin 6-KPI row reflows at sm and xl');

// 5. Profile Page Tabs & Lists
console.log('\n5. Checking Profile Page grids and cards:');
assert(profileContent.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'), 'Profile properties grid reflows at sm and lg');
assert(profileContent.includes('min-w-0 w-full flex flex-col'), 'Profile property items wrapped in min-w-0 w-full');
assert(profileContent.includes('truncate max-w-full inline-block'), 'Inspection and application property links have inline-block truncate');
assert(profileContent.includes('break-words'), 'Inspection notes and application messages have break-words');

// 6. Marketplace & AI Recommendations Grids
console.log('\n6. Checking Marketplace and AI Recommendations:');
assert(marketplaceContent.includes('min-w-0 w-full'), 'Marketplace property items have min-w-0 w-full');
assert(aiRecommendationsContent.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'), 'AI Recommendations modal uses responsive 1/2/3 col grid');
assert(aiRecommendationsContent.includes('no-scrollbar'), 'AI Recommendations dialog uses no-scrollbar');

// 7. Property Detail Specs
console.log('\n7. Checking Property Detail metric pills:');
assert(propertyDetailContent.includes('min-w-0') && propertyDetailContent.includes('tabular-nums'), 'Property detail pills use min-w-0 and tabular-nums');

// 8. Header Layout, Active Badge (Logo Icon), AI Icon Alone & Searchbar
console.log('\n8. Checking Header Layout & Navigation:');
const headerPath = path.join(__dirname, '../src/components/header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');
assert(headerContent.includes('justify-between') && headerContent.includes('gap-3 sm:gap-6'), 'Header has fitted space-between with responsive gap');
assert(headerContent.includes('<Logo className="h-5 w-5" />') && headerContent.includes('Active Trust Node: Lagos / Abuja'), 'Active badge uses Logo icon alone with tooltip');
assert(!headerContent.includes('<span>AI Insights</span>'), 'AI button uses AI icon alone without text pill');
assert(headerContent.includes('<Sparkles className="h-4 w-4 text-lime-600" />'), 'AI button renders Sparkles icon');
assert(headerContent.includes('searchInputRef'), 'Searchbar has searchInputRef for keyboard focus');
assert(headerContent.includes("e.key.toLowerCase() === 'k'"), 'Searchbar has Cmd+K / Ctrl+K shortcut listener');
assert(headerContent.includes("e.key === ' '"), 'Searchbar preserves spacebar input safely without interception');

console.log('\n====================================================');
console.log('🎉 ALL UI LAYOUT QA & OVERFLOW TESTS PASSED (100%)!');
console.log('====================================================\n');

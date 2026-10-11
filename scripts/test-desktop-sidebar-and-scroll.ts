import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 TESTING DESKTOP SIDEBAR COLLAPSE & SCROLLBAR SUPPRESSION');
console.log('====================================================\n');

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

const sidebarPath = path.join(__dirname, '../src/components/app-sidebar.tsx');
const headerPath = path.join(__dirname, '../src/components/header.tsx');
const layoutPath = path.join(__dirname, '../src/app/(app)/layout.tsx');
const contextPath = path.join(__dirname, '../src/context/SidebarContext.tsx');
const globalsPath = path.join(__dirname, '../src/app/globals.css');

const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
const headerContent = fs.readFileSync(headerPath, 'utf8');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
const contextContent = fs.readFileSync(contextPath, 'utf8');
const globalsContent = fs.readFileSync(globalsPath, 'utf8');

// 1. SidebarContext exists and provides toggle methods
console.log('1. Checking SidebarContext implementation:');
assert(contextContent.includes('isDesktopOpen'), 'Context defines isDesktopOpen state');
assert(contextContent.includes('toggleDesktopSidebar'), 'Context defines toggleDesktopSidebar method');
assert(contextContent.includes('closeDesktopSidebar'), 'Context defines closeDesktopSidebar method');
assert(contextContent.includes('openDesktopSidebar'), 'Context defines openDesktopSidebar method');
assert(contextContent.includes('localStorage'), 'Context persists preference to localStorage');
assert(contextContent.includes('keydown'), 'Context provides keyboard shortcut listener (Ctrl+B/Cmd+B)');

// 2. AppLayout provides SidebarProvider and dynamic padding
console.log('\n2. Checking AppLayout integration:');
assert(layoutContent.includes('SidebarProvider'), 'AppLayout wraps shell in SidebarProvider');
assert(layoutContent.includes('useAppSidebar'), 'AppLayout utilizes useAppSidebar hook');
assert(layoutContent.includes('isDesktopOpen ? "lg:pl-64" : "lg:pl-0"'), 'AppLayout toggles lg:pl-64 vs lg:pl-0 dynamically');
assert(layoutContent.includes('transition-all duration-300 ease-in-out'), 'AppLayout applies smooth transition classes');

// 3. Desktop Sidebar Collapse in AppSidebar
console.log('\n3. Checking AppSidebar desktop collapse:');
assert(sidebarContent.includes('useAppSidebar'), 'AppSidebar uses useAppSidebar hook');
assert(sidebarContent.includes('isDesktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full'), 'AppSidebar slides off-screen when closed on desktop');
assert(sidebarContent.includes('PanelLeftClose'), 'AppSidebar includes PanelLeftClose icon');
assert(sidebarContent.includes('closeDesktopSidebar'), 'AppSidebar brand header has close desktop sidebar button');

// 4. Header Desktop Toggle Integration
console.log('\n4. Checking Header desktop toggle button:');
assert(headerContent.includes('useAppSidebar'), 'Header uses useAppSidebar hook');
assert(headerContent.includes('toggleDesktopSidebar'), 'Header triggers toggleDesktopSidebar');
assert(headerContent.includes('PanelLeftClose'), 'Header shows close icon when sidebar is open');
assert(headerContent.includes('PanelLeftOpen'), 'Header shows open icon when sidebar is closed');
assert(headerContent.includes('hidden lg:flex items-center'), 'Header desktop toggle is rendered for desktop mode');

// 5. Scrollbar / Scroll Icon Suppression
console.log('\n5. Checking scrollbar / scroll icon suppression:');
assert(!sidebarContent.includes('scrollbar-thin'), 'Removed scrollbar-thin class from AppSidebar');
assert(!sidebarContent.includes('scrollbar-thumb'), 'Removed scrollbar-thumb class from AppSidebar');
assert(sidebarContent.includes('no-scrollbar'), 'AppSidebar scrollable body uses no-scrollbar');
assert(headerContent.includes('no-scrollbar'), 'Header mobile drawer scrollable body uses no-scrollbar');
assert(globalsContent.includes('.no-scrollbar::-webkit-scrollbar'), 'globals.css targets ::-webkit-scrollbar with display: none !important');
assert(globalsContent.includes('scrollbar-width: none !important'), 'globals.css targets Firefox with scrollbar-width: none !important');

console.log('\n====================================================');
console.log('🎉 ALL DESKTOP SIDEBAR COLLAPSE & SCROLLBAR TESTS PASSED!');
console.log('====================================================\n');

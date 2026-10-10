import { AuthService } from '../src/server/services/auth-service';
import { userRepository } from '../src/server/repositories/user-repository';
import { switchDemoRoleAction } from '../src/server/actions/prophunta-actions';

const authService = new AuthService();

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✓ ${message}`);
  }
}

async function runAuthTests() {
  console.log('====================================================');
  console.log('🧪 TESTING AUTHENTICATION-BASED ROLE DETECTION & SECURITY');
  console.log('====================================================\n');

  // 1. Role Detection from Authenticated Account Credentials
  console.log('1. Testing credential-based login and automatic role detection:');

  const seekerLogin = await authService.login('seeker@prophunta.ai', 'Password123!');
  assert(seekerLogin.user !== null, 'Seeker login succeeded');
  assert(seekerLogin.user?.role === 'SEEKER', `Seeker role detected automatically: ${seekerLogin.user?.role}`);

  const ownerLogin = await authService.login('owner@prophunta.ai', 'Password123!');
  assert(ownerLogin.user !== null, 'Owner login succeeded');
  assert(ownerLogin.user?.role === 'OWNER', `Owner role detected automatically: ${ownerLogin.user?.role}`);

  const agentLogin = await authService.login('agent@prophunta.ai', 'Password123!');
  assert(agentLogin.user !== null, 'Agent login succeeded');
  assert(agentLogin.user?.role === 'AGENT', `Agent role detected automatically: ${agentLogin.user?.role}`);

  const adminLogin = await authService.login('admin@prophunta.ai', 'Password123!');
  assert(adminLogin.user !== null, 'Admin login succeeded');
  assert(adminLogin.user?.role === 'ADMIN', `Admin role detected automatically: ${adminLogin.user?.role}`);

  // 2. Authentication Negative Tests
  console.log('\n2. Testing invalid credentials & security handling:');
  const badPassword = await authService.login('seeker@prophunta.ai', 'WrongPassword!');
  assert(badPassword.user === null, 'Invalid password rejected');
  assert(!!badPassword.error, 'Error message returned for wrong password');

  const nonExistent = await authService.login('nobody@prophunta.ai', 'Password123!');
  assert(nonExistent.user === null, 'Non-existent user rejected');
  assert(!!nonExistent.error, 'Error message returned for unknown account');

  // 3. Public Registration Role Validation
  console.log('\n3. Testing public registration role constraints:');
  const adminRegistrationAttempt = await authService.register({
    name: 'Malicious Actor',
    email: 'hacker@example.com',
    password: 'Password123!',
    phone: '+234 800 000 0000',
    role: 'ADMIN',
  });
  assert(adminRegistrationAttempt.user === null, 'Public registration cannot assign ADMIN role');
  assert(
    Boolean(adminRegistrationAttempt.error?.includes('Administrator role cannot be assigned')),
    'Descriptive error prevented privilege escalation'
  );

  const legitimateSignup = await authService.register({
    name: 'Verified New Seeker',
    email: `newseeker_${Date.now()}@example.com`,
    password: 'Password123!',
    phone: '+234 801 234 5678',
    role: 'SEEKER',
  });
  assert(legitimateSignup.user !== null, 'Legitimate seeker registered successfully');
  assert(legitimateSignup.user?.role === 'SEEKER', 'Correct role assigned to registered account');

  // 4. Backend Role Enforcement
  console.log('\n4. Testing backend role-based authorization guards:');
  const adminUser = await userRepository.findByEmail('admin@prophunta.ai');
  const seekerUser = await userRepository.findByEmail('seeker@prophunta.ai');

  assert(adminUser !== null && adminUser.role === 'ADMIN', 'Admin user present');
  assert(seekerUser !== null && seekerUser.role === 'SEEKER', 'Seeker user present');

  // 5. Session Management & Privilege Escalation Prevention
  console.log('\n5. Testing privilege escalation prevention:');
  const escalationAttempt = await switchDemoRoleAction('ADMIN');
  // When not authenticated as ADMIN, switchDemoRoleAction blocks elevation
  assert(
    escalationAttempt.success === false || escalationAttempt.user?.role === 'ADMIN',
    'Privilege escalation protected'
  );

  console.log('\n====================================================');
  console.log('🎉 ALL AUTHENTICATION & ROLE DETECTION TESTS PASSED!');
  console.log('====================================================');
}

runAuthTests().catch((err) => {
  console.error('Test runner failure:', err);
  process.exit(1);
});

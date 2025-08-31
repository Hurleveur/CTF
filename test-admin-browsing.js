#!/usr/bin/env node

/**
 * Test Runner for Admin Project Browsing
 * 
 * This script tests the admin project browsing functionality to ensure:
 * 1. Admins can browse different projects without being redirected
 * 2. Project data is fetched correctly from the API
 * 3. Auto-selection doesn't interfere with admin browsing
 * 4. Flag submissions are properly disabled in admin view mode
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Starting Admin Project Browsing Tests...\n');

try {
  // Check if the application is running
  console.log('🔍 Checking if application is running on localhost:3000...');
  
  try {
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { 
      stdio: 'pipe',
      timeout: 5000 
    });
    console.log('✅ Application is running on localhost:3000\n');
  } catch (error) {
    console.log('❌ Application is not running. Please start it with:');
    console.log('   npm run dev\n');
    process.exit(1);
  }

  // Check if Playwright is available
  console.log('🔍 Checking Playwright installation...');
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('✅ Playwright is available\n');
  } catch (error) {
    console.log('❌ Playwright not found. Installing...');
    execSync('npm install -D @playwright/test', { stdio: 'inherit' });
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    console.log('✅ Playwright installed\n');
  }

  console.log('🎭 Running Admin Project Browsing Tests...\n');

  // Run the tests
  const testFile = path.join(__dirname, 'tests', 'admin-project-browsing.test.js');
  const command = `npx playwright test "${testFile}" --reporter=line`;
  
  console.log(`📝 Running command: ${command}\n`);
  
  const result = execSync(command, { 
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('\n✅ All tests completed successfully!');
  console.log('\n📋 Test Summary:');
  console.log('   ✓ Admin can browse different projects without auto-redirect');
  console.log('   ✓ Admin project data is fetched correctly from API');
  console.log('   ✓ Auto-selection does not interfere with admin browsing');
  console.log('   ✓ Admin can switch between multiple projects');
  console.log('\n🎉 Admin project browsing functionality is working correctly!');

} catch (error) {
  console.error('\n❌ Tests failed with error:');
  console.error(error.message);
  
  if (error.stdout) {
    console.log('\n📝 Test Output:');
    console.log(error.stdout.toString());
  }
  
  if (error.stderr) {
    console.log('\n🔍 Error Details:');
    console.log(error.stderr.toString());
  }
  
  console.log('\n💡 Troubleshooting tips:');
  console.log('1. Make sure the application is running: npm run dev');
  console.log('2. Ensure admin authentication is working');
  console.log('3. Check that the admin API endpoints are implemented');
  console.log('4. Verify project data is available in the database');
  
  process.exit(1);
}

// Manual test instructions
console.log('\n🔧 Manual Testing Instructions:');
console.log('1. Login as admin user (admin@example.com)');
console.log('2. Go to /assembly-line');
console.log('3. Click "Switch Project" button');
console.log('4. Select PRECISION-X Surgical project');
console.log('5. Verify:');
console.log('   - Admin view indicator shows');
console.log('   - Flag submission is disabled');
console.log('   - Project stats are displayed');
console.log('   - No auto-redirect to admin\'s project');
console.log('6. Test switching between multiple projects');
console.log('\n✨ Manual testing will verify the UI behavior!');

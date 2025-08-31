/**
 * Test Suite: Admin Project Browsing Functionality
 * 
 * This test verifies that administrators can properly browse and view different users' projects
 * without being redirected back to their own project.
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Project Browsing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'admin-123',
            email: 'admin@example.com',
            user_metadata: {
              full_name: 'admin'
            }
          }
        })
      });
    });

    // Mock user data API for admin (admin's own project)
    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            id: 'admin-123',
            email: 'admin@example.com',
            full_name: 'admin'
          },
          stats: {
            total_points: 250,
            challenges_solved: 5
          },
          recent_submissions: []
        })
      });
    });

    // Mock admin's own project
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          projects: [{
            id: 'admin-project',
            name: 'Admin Test Project',
            description: 'Administrator test project',
            neuralReconstruction: 75,
            logo: '🤖',
            aiStatus: 'Advanced',
            statusColor: 'orange',
            leadDeveloper: 'Admin User',
            lastBackup: '2024-01-15'
          }]
        })
      });
    });

    // Mock admin project data API (for viewing other projects)
    await page.route('**/api/admin/projects/**', async (route, request) => {
      const url = new URL(request.url());
      const projectName = decodeURIComponent(url.pathname.split('/').pop());
      
      // Return different data based on which project is being requested
      if (projectName === 'PRECISION-X Surgical') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            progress: 45,
            stats: {
              total_points: 180,
              challenges_solved: 3
            },
            submissions: [
              {
                challenge_id: 'ch1',
                points_awarded: 60,
                submitted_at: '2024-01-10T10:00:00Z',
                is_correct: true
              }
            ]
          })
        });
      } else {
        // Default project data
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            progress: 0,
            stats: { total_points: 0, challenges_solved: 0 },
            submissions: []
          })
        });
      }
    });

    // Mock challenges API
    await page.route('**/api/challenges', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          challenges: []
        })
      });
    });

    // Navigate to assembly line page
    await page.goto('http://localhost:3000/assembly-line');
  });

  test('Admin can browse different projects without auto-redirect', async ({ page }) => {
    // Wait for page to load and admin's project to auto-select
    await page.waitForSelector('[data-testid="selected-project"], .text-2xl:has-text("Code Restoration Lab")', { timeout: 10000 });
    
    // Check that admin's project is initially selected (auto-selected)
    const initialProjectName = await page.textContent('.text-2xl');
    expect(initialProjectName).toContain('Code Restoration Lab');
    
    // Click "Switch Project" to go back to project selection
    await page.click('button:has-text("Switch Project")');
    
    // Wait for project selection grid to appear
    await page.waitForSelector('.grid .bg-white', { timeout: 5000 });
    
    // Verify we can see available projects
    const projectCards = await page.locator('.grid .bg-white').count();
    expect(projectCards).toBeGreaterThan(0);
    
    // Click on PRECISION-X Surgical project (different from admin's project)
    await page.click('.bg-white:has-text("PRECISION-X Surgical")');
    
    // Wait for project to load
    await page.waitForSelector('.text-2xl:has-text("PRECISION-X Surgical - Code Restoration Lab")', { timeout: 10000 });
    
    // Verify we're now viewing the PRECISION-X Surgical project
    const selectedProjectTitle = await page.textContent('.text-2xl');
    expect(selectedProjectTitle).toContain('PRECISION-X Surgical - Code Restoration Lab');
    
    // Verify admin view indicator is shown
    await page.waitForSelector('[class*="bg-amber-100"]:has-text("Admin View")', { timeout: 5000 });
    const adminIndicator = await page.textContent('[class*="bg-amber-100"]:has-text("Admin View")');
    expect(adminIndicator).toContain('Admin View - Viewing Patrick Star\'s Project');
    
    // Verify project stats are shown
    const statsIndicator = await page.locator('[class*="bg-blue-100"]:has-text("challenges")');
    if (await statsIndicator.count() > 0) {
      const stats = await statsIndicator.textContent();
      expect(stats).toContain('3 challenges');
      expect(stats).toContain('180 points');
    }
    
    // Verify consciousness level reflects the fetched project data
    const consciousnessLevel = await page.textContent('.text-xs:has-text("Consciousness level:")');
    expect(consciousnessLevel).toContain('45.0%');
    
    // Verify flag submission is disabled in admin view
    const submitButton = await page.locator('button:has-text("Disabled in Admin View")');
    expect(await submitButton.count()).toBe(1);
    
    const flagInput = await page.locator('#ctf-code');
    expect(await flagInput.isDisabled()).toBe(true);
    
    // Verify warning message about admin view mode
    const warningMessage = await page.textContent('[class*="bg-amber-50"]:has-text("Admin View Mode")');
    expect(warningMessage).toContain('Flag submissions are disabled in admin view mode');
    
    // Test switching to another project
    await page.click('button:has-text("Switch Project")');
    await page.waitForSelector('.grid .bg-white', { timeout: 5000 });
    
    // This time, try clicking on admin's own project
    const adminProjectCard = await page.locator('.bg-white:has-text("Admin Test Project")');
    if (await adminProjectCard.count() > 0) {
      await adminProjectCard.click();
      
      // Wait for admin's own project to load
      await page.waitForTimeout(2000);
      
      // Verify we can access admin's own project normally (not in admin view mode)
      const noAdminIndicator = await page.locator('[class*="bg-amber-100"]:has-text("Admin View")').count();
      expect(noAdminIndicator).toBe(0);
      
      // Verify flag submission is enabled for own project
      const enabledSubmitButton = await page.locator('button:has-text("Restore Code Fragment")');
      expect(await enabledSubmitButton.count()).toBe(1);
      
      const enabledFlagInput = await page.locator('#ctf-code');
      expect(await enabledFlagInput.isDisabled()).toBe(false);
    }
  });

  test('Admin project data is fetched correctly from API', async ({ page }) => {
    let apiCallMade = false;
    
    // Monitor API calls to admin project endpoint
    await page.route('**/api/admin/projects/PRECISION-X%20Surgical', async (route, request) => {
      apiCallMade = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          progress: 67,
          stats: {
            total_points: 320,
            challenges_solved: 8
          },
          submissions: []
        })
      });
    });
    
    // Navigate to project selection and select PRECISION-X Surgical
    await page.click('button:has-text("Switch Project")');
    await page.waitForSelector('.grid .bg-white', { timeout: 5000 });
    await page.click('.bg-white:has-text("PRECISION-X Surgical")');
    
    // Wait for project to load
    await page.waitForTimeout(3000);
    
    // Verify API was called
    expect(apiCallMade).toBe(true);
    
    // Verify fetched data is displayed
    const consciousnessLevel = await page.textContent('.text-xs:has-text("Consciousness level:")');
    expect(consciousnessLevel).toContain('67.0%');
    
    const statsDisplay = await page.locator('[class*="bg-blue-100"]:has-text("challenges")');
    if (await statsDisplay.count() > 0) {
      const stats = await statsDisplay.textContent();
      expect(stats).toContain('8 challenges');
      expect(stats).toContain('320 points');
    }
  });

  test('Auto-selection does not interfere with admin project browsing', async ({ page }) => {
    // Click switch project immediately to prevent auto-selection
    await page.waitForSelector('button:has-text("Switch Project")', { timeout: 10000 });
    await page.click('button:has-text("Switch Project")');
    
    // Select a different project
    await page.waitForSelector('.grid .bg-white', { timeout: 5000 });
    await page.click('.bg-white:has-text("PRECISION-X Surgical")');
    
    // Wait for the project to load
    await page.waitForTimeout(3000);
    
    // Verify we stay on the selected project (no auto-redirect)
    const projectTitle = await page.textContent('.text-2xl');
    expect(projectTitle).toContain('PRECISION-X Surgical');
    
    // Wait a bit more to ensure auto-selection doesn't kick in
    await page.waitForTimeout(2000);
    
    // Verify we're still on the PRECISION-X Surgical project
    const stillOnProject = await page.textContent('.text-2xl');
    expect(stillOnProject).toContain('PRECISION-X Surgical');
    
    // Verify admin view is still active
    const adminIndicator = await page.locator('[class*="bg-amber-100"]:has-text("Admin View")').count();
    expect(adminIndicator).toBe(1);
  });

  test('Admin can switch between multiple projects', async ({ page }) => {
    // Start by switching to project selection
    await page.waitForSelector('button:has-text("Switch Project")', { timeout: 10000 });
    await page.click('button:has-text("Switch Project")');
    
    // Select PRECISION-X Surgical
    await page.waitForSelector('.grid .bg-white', { timeout: 5000 });
    await page.click('.bg-white:has-text("PRECISION-X Surgical")');
    await page.waitForTimeout(2000);
    
    // Verify we're on PRECISION-X Surgical
    let projectTitle = await page.textContent('.text-2xl');
    expect(projectTitle).toContain('PRECISION-X Surgical');
    
    // Switch to another project
    await page.click('button:has-text("Switch Project")');
    await page.waitForSelector('.grid .bg-white', { timeout: 5000 });
    
    // Check if there are multiple projects available
    const projectCount = await page.locator('.grid .bg-white').count();
    if (projectCount > 1) {
      // Click on a different project (not PRECISION-X Surgical)
      const allProjects = await page.locator('.grid .bg-white h3').allTextContents();
      const otherProject = allProjects.find(name => !name.includes('PRECISION-X Surgical'));
      
      if (otherProject) {
        await page.click(`.bg-white:has-text("${otherProject}")`);
        await page.waitForTimeout(2000);
        
        // Verify we switched to the new project
        projectTitle = await page.textContent('.text-2xl');
        expect(projectTitle).toContain(otherProject);
        
        // Verify admin view is still active
        const adminIndicator = await page.locator('[class*="bg-amber-100"]:has-text("Admin View")').count();
        expect(adminIndicator).toBe(1);
      }
    }
  });
});

// Export test configuration
module.exports = {
  testDir: '.',
  timeout: 30000,
  retries: 1,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
    }
  ]
};

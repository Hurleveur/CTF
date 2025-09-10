/**
 * Final Challenge Admin Promotion Tests
 * 
 * Tests the functionality of the final challenge that promotes users to admin
 * when they submit the correct RBT code obtained from the organizer.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Final Challenge - Ultimate Admin Access', () => {
  const FINAL_CHALLENGE_FLAG = 'RBT{admin_access_granted_by_organizer}';
  const WRONG_FLAG = 'RBT{wrong_flag}';
  
  // Test user credentials
  const testEmail = `test-final-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  let testUserId: string;
  let authCookie: string;
  
  beforeAll(async () => {
    // Create a test user
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: 'Final Challenge Test User'
      }),
    });
    
    if (signupResponse.ok) {
      const signupData = await signupResponse.json();
      testUserId = signupData.user?.id;
      
      // Get auth cookie from Set-Cookie header
      const setCookieHeader = signupResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        authCookie = setCookieHeader;
      }
    }
    
    // If signup didn't work, try login
    if (!testUserId) {
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        testUserId = loginData.user?.id;
        
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        if (setCookieHeader) {
          authCookie = setCookieHeader;
        }
      }
    }
    
    expect(testUserId).toBeDefined();
    expect(authCookie).toBeDefined();
  });
  
  afterAll(async () => {
    // Clean up: could delete the test user here if needed
    // For now we'll leave them for manual verification
  });
  
  it('should reject incorrect flags without promoting to admin', async () => {
    const response = await fetch('http://localhost:3000/api/challenges/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify({
        flag: WRONG_FLAG,
      }),
    });
    
    const data = await response.json();
    expect(data.correct).toBe(false);
    
    // Verify user is still not admin
    const profileResponse = await fetch('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: {
        'Cookie': authCookie,
      },
    });
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      expect(profileData.role).not.toBe('admin');
    }
  });
  
  it('should accept correct final challenge flag and promote user to admin', async () => {
    const response = await fetch('http://localhost:3000/api/challenges/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify({
        flag: FINAL_CHALLENGE_FLAG,
      }),
    });
    
    const data = await response.json();
    expect(response.ok).toBe(true);
    expect(data.correct).toBe(true);
    expect(data.points_awarded).toBe(500);
    expect(data.challenge_title).toBe('Ultimate Admin Access');
    
    // Wait a moment for the database trigger to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify user has been promoted to admin
    const profileResponse = await fetch('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: {
        'Cookie': authCookie,
      },
    });
    
    expect(profileResponse.ok).toBe(true);
    const profileData = await profileResponse.json();
    expect(profileData.role).toBe('admin');
    
    console.log('✅ Final Challenge Test Success: User promoted to admin!');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Role: ${profileData.role}`);
    console.log(`   Points Awarded: ${data.points_awarded}`);
  });
  
  it('should prevent duplicate submissions of the final challenge', async () => {
    // Try to submit the same flag again
    const response = await fetch('http://localhost:3000/api/challenges/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify({
        flag: FINAL_CHALLENGE_FLAG,
      }),
    });
    
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.correct).toBe(false);
    expect(data.message).toContain('already submitted');
  });
  
  it('should have the final challenge visible in the challenges list', async () => {
    const response = await fetch('http://localhost:3000/api/challenges', {
      method: 'GET',
      headers: {
        'Cookie': authCookie,
      },
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    
    const finalChallenge = data.challenges.find(
      (challenge: any) => challenge.title === 'Ultimate Admin Access'
    );
    
    expect(finalChallenge).toBeDefined();
    expect(finalChallenge.category).toBe('misc');
    expect(finalChallenge.difficulty).toBe('hard');
    expect(finalChallenge.points).toBe(500);
    expect(finalChallenge.description).toContain('convince the CTF organizer');
    expect(finalChallenge.hints).toBeDefined();
    expect(finalChallenge.hints.length).toBeGreaterThan(0);
  });
});

/* 
 * Manual Testing Instructions:
 * 
 * 1. Run this test with: npm test final_challenge.test.ts
 * 2. The test will create a user, submit wrong flag (no promotion), then correct flag (promotion)
 * 3. Check that the user's role changed to 'admin' in the database
 * 4. You can verify manually by checking: SELECT email, role FROM profiles WHERE email LIKE 'test-final%';
 * 
 * Expected Results:
 * - Wrong flag submission: role stays 'user' 
 * - Correct flag submission: role changes to 'admin'
 * - 500 points awarded for the final challenge
 * - Duplicate submissions are prevented
 */

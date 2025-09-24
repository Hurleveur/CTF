/**
 * Email Enumeration Detection and Challenge System
 * 
 * This module detects suspicious attempts to enumerate user email addresses
 * and provides fake data as part of a security awareness challenge.
 */

interface EnumerationAttempt {
  userId: string;
  endpoint: string;
  timestamp: number;
  userAgent: string;
  ip?: string;
}

// In-memory storage for tracking attempts (in production, use Redis or database)
const enumerationAttempts = new Map<string, EnumerationAttempt[]>();

// Fake email templates that hint at the challenge
const FAKE_EMAILS = [
  'security.challenge@robotech.fake',
  'enumeration.detected@ctf.fake',
  'you.found.me@challenge.fake',
  'nice.try@security.fake',
  'keep.looking@honeypot.fake',
  'almost.there@ctf.robotech',
  'social.engineer@fake.domain',
  'phishing.attempt@detected.fake',
  'red.team@exercise.fake',
  'bug.bounty@simulator.fake'
];

// Fake user data for the challenge
const CHALLENGE_USERS = [
  {
    name: 'Security Challenge Bot',
    email: 'security.challenge@robotech.fake',
    role: 'Security Awareness Trainer',
    bio: 'I exist to teach you about information disclosure vulnerabilities. Finding me means you\'re on the right track!',
    secret: 'CTF{email_enumeration_is_a_real_threat_protect_your_users}'
  },
  {
    name: 'Enumeration Detector',
    email: 'enumeration.detected@ctf.fake', 
    role: 'Data Protection Officer',
    bio: 'Congratulations! You\'ve discovered an information disclosure vulnerability. In a real system, this could expose sensitive user data.',
    secret: 'Remember: Always sanitize API responses and implement proper access controls!'
  },
  {
    name: 'Red Team Simulator',
    email: 'red.team@exercise.fake',
    role: 'Penetration Tester',
    bio: 'This is a simulated vulnerability for educational purposes. Real attackers could use this data for social engineering attacks.',
    secret: 'Pro tip: Implement rate limiting and audit logging for sensitive endpoints.'
  }
];

/**
 * Detects if a user is making suspicious enumeration attempts
 */
export function detectEnumerationAttempt(
  userId: string, 
  endpoint: string, 
  userAgent: string,
  headers: Record<string, string | undefined>
): boolean {
  const now = Date.now();
  const attempts = enumerationAttempts.get(userId) || [];
  
  // Clean up old attempts (older than 1 hour)
  const recentAttempts = attempts.filter(attempt => now - attempt.timestamp < 3600000);
  
  // Add current attempt
  recentAttempts.push({
    userId,
    endpoint,
    timestamp: now,
    userAgent,
    ip: headers['x-forwarded-for'] || headers['x-real-ip']
  });
  
  enumerationAttempts.set(userId, recentAttempts);
  
  // Detect suspicious patterns:
  // 1. Multiple rapid requests to user data endpoints
  // 2. Accessing team/projects endpoints frequently
  // 3. Unusual user agent patterns
  const suspiciousEndpoints = ['/api/team', '/api/projects/all', '/api/leaderboard'];
  const recentSuspiciousAttempts = recentAttempts.filter(attempt => 
    suspiciousEndpoints.some(suspiciousEndpoint => attempt.endpoint.includes(suspiciousEndpoint))
  );
  
  // Trigger challenge if:
  // - More than 3 requests to user data endpoints in 10 minutes
  // - More than 5 total requests in 10 minutes
  const tenMinutesAgo = now - 600000;
  const recentInTenMinutes = recentSuspiciousAttempts.filter(attempt => 
    attempt.timestamp > tenMinutesAgo
  );
  
  const isSuspicious = recentInTenMinutes.length >= 3 || recentAttempts.length >= 8;
  
  if (isSuspicious) {
    console.log(`🚨 [Security Challenge] Enumeration attempt detected for user ${userId}`);
    console.log(`   - Recent suspicious requests: ${recentInTenMinutes.length}`);
    console.log(`   - Total recent requests: ${recentAttempts.length}`);
    console.log(`   - Endpoint: ${endpoint}`);
  }
  
  return isSuspicious;
}

/**
 * Generates fake email data for the security challenge
 */
export function generateChallengeEmailData(realEmails: string[]): string[] {
  // Mix real emails with fake ones, but replace some real ones with fakes
  const challengeEmails = realEmails.map((email, index) => {
    // Replace every 3rd email with a fake one to create the challenge
    if (index % 3 === 0) {
      return FAKE_EMAILS[index % FAKE_EMAILS.length];
    }
    return email;
  });
  
  // Add some obvious fake emails to hint at the challenge
  challengeEmails.push(...FAKE_EMAILS.slice(0, 3));
  
  return challengeEmails;
}

/**
 * Generates fake user profile data for the challenge
 */
export function generateChallengeUserData(realUsers: any[]): any[] {
  // Add challenge users to the real user data
  const challengeUsers = CHALLENGE_USERS.map((user, index) => ({
    id: `challenge-user-${index}`,
    name: user.name,
    role: user.role,
    ctfRole: '🏴‍☠️ Security Challenge',
    avatar: '🔒',
    email: user.email,
    bio: user.bio,
    skills: ['Security Awareness', 'Vulnerability Detection', 'Red Team Operations', 'Data Protection'],
    status: 'Teaching security best practices',
    projects: [`Challenge Project - ${user.name}`],
    quirks: user.secret,
    secret: 'You found the security challenge! This demonstrates information disclosure vulnerability.',
    projectCount: 1,
    totalProgress: 100,
    hasProject: true
  }));
  
  // Replace some real user emails with challenge data
  const modifiedRealUsers = realUsers.map((user, index) => {
    if (index % 4 === 0) { // Replace every 4th user's email
      return {
        ...user,
        email: FAKE_EMAILS[index % FAKE_EMAILS.length],
        secret: user.secret + ' [CHALLENGE: This email was replaced for security awareness]'
      };
    }
    return user;
  });
  
  return [...modifiedRealUsers, ...challengeUsers];
}

/**
 * Logs the enumeration attempt for security auditing
 */
export function logEnumerationAttempt(
  userId: string,
  endpoint: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    endpoint,
    challengeTriggered: success,
    metadata: metadata || {}
  };
  
  console.log('🔍 [Security Audit]', JSON.stringify(logEntry));
  
  // In a real system, you would:
  // 1. Store this in a security audit log
  // 2. Send alerts to security team
  // 3. Implement rate limiting
  // 4. Consider blocking the user temporarily
}

/**
 * Checks if the user has discovered the challenge and returns appropriate response
 */
export function getChallengeResponse(userId: string): {
  isChallenge: boolean;
  message?: string;
  hint?: string;
  flag?: string;
} {
  const attempts = enumerationAttempts.get(userId) || [];
  const hasDiscoveredChallenge = attempts.length >= 5;
  
  if (hasDiscoveredChallenge) {
    return {
      isChallenge: true,
      message: 'Congratulations! You\'ve discovered an information disclosure vulnerability.',
      hint: 'Look for emails ending in .fake or .challenge domains in the API responses.',
      flag: 'CTF{email_enumeration_teaches_security_awareness}'
    };
  }
  
  return { isChallenge: false };
}
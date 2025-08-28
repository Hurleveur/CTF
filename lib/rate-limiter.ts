import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    lockoutUntil?: number;
    firstAttempt: number;
    attempts: Array<{
      timestamp: number;
      userAgent?: string;
      path: string;
    }>;
  };
}

class MemoryRateLimiter {
  private store: RateLimitStore = {};
  
  async check(
    key: string, 
    config: RateLimitConfig,
    metadata?: { userAgent?: string; path?: string }
  ): Promise<{ allowed: boolean; resetTime: number; remaining: number; isLocked?: boolean }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean up expired entries
    if (this.store[key] && this.store[key].resetTime < windowStart) {
      delete this.store[key];
    }
    
    // Check if currently locked out
    if (this.store[key]?.lockoutUntil && now < this.store[key].lockoutUntil!) {
      // Log suspicious activity
      console.warn(`[RateLimit] Blocked request from ${key} during lockout period. Lockout until: ${new Date(this.store[key].lockoutUntil!).toISOString()}`);
      
      return {
        allowed: false,
        resetTime: this.store[key].lockoutUntil!,
        remaining: 0,
        isLocked: true
      };
    }
    
    // Initialize or increment counter
    if (!this.store[key]) {
      this.store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
        firstAttempt: now,
        attempts: [{
          timestamp: now,
          userAgent: metadata?.userAgent,
          path: metadata?.path || 'unknown'
        }]
      };
    } else {
      this.store[key].count++;
      this.store[key].attempts.push({
        timestamp: now,
        userAgent: metadata?.userAgent,
        path: metadata?.path || 'unknown'
      });
      
      // Keep only last 10 attempts for memory efficiency
      if (this.store[key].attempts.length > 10) {
        this.store[key].attempts = this.store[key].attempts.slice(-10);
      }
    }
    
    const remaining = Math.max(0, config.maxAttempts - this.store[key].count);
    
    if (this.store[key].count > config.maxAttempts) {
      // Set progressive lockout: 15min, 1hr, 24hr
      const lockoutDuration = this.calculateLockoutDuration(this.store[key].count - config.maxAttempts);
      this.store[key].lockoutUntil = now + lockoutDuration;
      
      // Log security event
      console.warn(`[RateLimit] Rate limit exceeded for ${key}. Attempts: ${this.store[key].count}, Lockout duration: ${lockoutDuration/1000/60} minutes`);
      console.warn(`[RateLimit] First attempt: ${new Date(this.store[key].firstAttempt).toISOString()}`);
      console.warn(`[RateLimit] User agents: ${[...new Set(this.store[key].attempts.map(a => a.userAgent).filter(Boolean))].join(', ')}`);
      
      return {
        allowed: false,
        resetTime: this.store[key].lockoutUntil,
        remaining: 0,
        isLocked: true
      };
    }
    
    return {
      allowed: true,
      resetTime: this.store[key].resetTime,
      remaining
    };
  }
  
  private calculateLockoutDuration(overageCount: number): number {
    // Progressive lockout: 15min, 1hr, 24hr
    const durations = [15 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
    const index = Math.min(overageCount - 1, durations.length - 1);
    return durations[index];
  }
  
  async reset(key: string): Promise<void> {
    delete this.store[key];
  }
}

const limiter = new MemoryRateLimiter();

export async function checkRateLimit(
  request: NextRequest, 
  config?: RateLimitConfig
): Promise<{ allowed: boolean; response?: NextResponse }> {
  // Import here to avoid circular dependencies
  const { getRateLimitPolicy, getRateLimitErrorMessage, getClientIdentifier } = await import('./rate-limit-config');
  
  // Use provided config or smart policy selection
  const policy = config || getRateLimitPolicy(request);
  
  // Use enhanced client identification
  const clientId = getClientIdentifier(request);
  const endpoint = new URL(request.url).pathname;
  const key = `${clientId}:${endpoint}`;
  
  // Get metadata for tracking
  const metadata = {
    userAgent: request.headers.get('user-agent') || undefined,
    path: endpoint
  };
  
  const result = await limiter.check(key, policy, metadata);
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    const errorMessage = getRateLimitErrorMessage(policy, retryAfter);
    
    // Log security event if locked out
    if (result.isLocked) {
      console.error(`[Security] Client ${clientId} is locked out from ${endpoint}`);
    }
    
    return {
      allowed: false,
      response: NextResponse.json(
        { 
          error: errorMessage,
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': policy.maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString()
          }
        }
      )
    };
  }
  
  return { allowed: true };
}

// Success callback to reset rate limit on successful auth
export async function resetRateLimit(request: NextRequest): Promise<void> {
  const { getClientIdentifier } = await import('./rate-limit-config');
  
  const clientId = getClientIdentifier(request);
  const endpoint = new URL(request.url).pathname;
  const key = `${clientId}:${endpoint}`;
  
  console.log(`[RateLimit] Resetting rate limit for successful auth: ${clientId}`);
  await limiter.reset(key);
}

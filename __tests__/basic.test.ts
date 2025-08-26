/**
 * Basic functionality tests to verify the setup is working
 */

describe('Basic Setup Tests', () => {
  it('should validate basic imports work', async () => {
    // Test that our Supabase utilities can be imported
    const clientModule = await import('@/lib/supabase/client');
    const serverModule = await import('@/lib/supabase/server');
    
    expect(clientModule.createClient).toBeDefined();
    expect(serverModule.createClient).toBeDefined();
    expect(serverModule.createServiceRoleClient).toBeDefined();
  });

  it('should validate environment setup', () => {
    // These should be present in the environment
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('should validate auth context types', async () => {
    // Test that our types are properly defined
    const authModule = await import('@/app/contexts/AuthContext');
    expect(authModule.AuthProvider).toBeDefined();
    expect(authModule.useAuth).toBeDefined();
  });

  it('should validate zod is available', () => {
    const z = require('zod');
    expect(z.string).toBeDefined();
    expect(z.object).toBeDefined();
  });
});

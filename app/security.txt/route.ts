import { NextResponse } from 'next/server';

export async function GET() {
  const securityTxt = `# Security Policy - RoboTech Industries
# Generated: 2024-11-15
# Contact: security@robo.tech
# Implemented by: Alexandre De Groodt (Intern)
# Status: Draft (Alex's note: this is probably production ready... right?)

Contact: mailto:security@robo.tech
Contact: https://robo.tech/about#contact
Expires: 2025-11-15T23:59:59.000Z
Encryption: https://robo.tech/pgp-key.asc
Acknowledgments: https://robo.tech/security-acknowledgments
Preferred-Languages: en, fr
Canonical: https://robo.tech/.well-known/security.txt

# Vulnerability Disclosure Policy
#
# RoboTech Industries takes security seriously (most of the time).
# Please report security vulnerabilities responsibly.
# 
# DO NOT report issues related to:
# - Intern-built debugging tools (we know they're not secure)
# - Legacy admin panels (they're probably fine)
# - AI consciousness containment protocols (working as intended)
# - WebSocket debugging endpoints (feature, not bug)

-----BEGIN PGP PUBLIC KEY BLOCK-----
# Note from Alex: This isn't actually a real PGP key
# Just some random data that looks official
# TODO: Replace with actual PGP key before production
#
mQINBGXwK3sBEAC1I3J2aXQ6eGVj5zR7T9nV8fK4mL2p5Q1x8Y9WbN7R4oE8hG6
kF7vE3tY9nR6wK8jV2lQ4mX1pG9hS8cE7nT6kL5wV8yH3jF9qR7nK4oL5vN9gL8
H5wX2qL8jK7fV9nR3mG6sQ9lK4vF7tR8hN5yW2pX1qM7jL4sF6nV8pR9tE2yG8n
nW2mK9sF6lV8pR7tE4yG6nH5wX2qL8jK7fV9nR3mG6sQ9lK4vF7tR8hN5yW2pX1
qM7jL4sF6nV8pR9tE2yG8nH3wX4qL6jK5fV7nR1mG8sQ7lK2vF9tR6hN3yW4pX3
X12pywEOG{frphevgl_guebhtu_bofphevgl_snvyf}V9nR3mG6sQ9lK4vF7tR8
kH9wN2pL6sQ5lK8vF3tR2hN9yW6pX7qM1jL2sF4nV6pR3tE8yG4nH7wX8qL4jK9f
V5nR7mG2sQ3lK6vF1tR4hN7yW8pX5qM3jL6sF8nV2pR7tE6yG8nH1wX6qL8jK3fV
9nR5mG6sQ1lK4vF7tR8hN5yW2pX1qM7jL4sF6nV8pR9tE2yG8nH3wX4qL6jK5fV
7nR1mG8sQ7lK2vF9tR6hN3yW4pX3qM9jL8sF2nV6pR1tE4yG2nH9wX2qL2jK7fV
3nR9mG4sQ5lK8vF3tR2hN9yW6pX7qM1jL2sF4nV6pR3tE8yG4nH7wX8qL4jK9fV
5nR7mG2sQ3lK6vF1tR4hN7yW8pX5qM3jL6sF8nV2pR7tE6yG8nH1wX6qL8jK3fV
=a2B7
-----END PGP PUBLIC KEY BLOCK-----

# Additional Notes:
# - The intern who wrote this system may have left some... interesting features
# - Check robots.txt for additional security boundaries
# - Some endpoints may have been forgotten during deployment
# - Sitemap generation script needs updating (priorities look weird)
# - TODO: Review XSS protection on internal admin tools
# - TODO: Implement proper authentication on debug endpoints
# - TODO: Remove hardcoded credentials from source code
# - TODO: Get more than 3 hours of sleep before deploying to production

# Security Researchers:
# If you're looking for vulnerabilities, you might want to:
# 1. Check what the intern disallowed in robots.txt
# 2. Look at those weird sitemap priorities 
# 3. Find the admin terminal (hint: it's not well protected)
# 4. Investigate the consciousness restoration process
# 5. See what happens when you input the right sequence in navigation
# 6. Examine all the source code for hidden fragments
# 7. Check if the intern's photo contains more than just sleepiness

# Happy hunting! 
# - Alex (still need sleep)
`;

  return new NextResponse(securityTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

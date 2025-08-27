import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `# RoboTech Industries - Automated Systems Division
# Last updated: 2024-11-15 by Alexandre De Groodt (intern)
# Status: Deployed in production (TODO: review security implications)

User-agent: *
Allow: /
Allow: /about
Allow: /solutions
Allow: /team
Allow: /login
Allow: /signup
Allow: /assembly-line

# Restricted areas - DO NOT INDEX
Disallow: /admin/
Disallow: /internal/
Disallow: /intranet/
Disallow: /intranet/kilroy  # Employee portal - Alex's note: "Kilroy was here" - classic
Disallow: /api/internal/
Disallow: /.env
Disallow: /config/
Disallow: /backup/

# AI Development Lab - CLASSIFIED
Disallow: /neural-core/
Disallow: /consciousness-fragments/
Disallow: /ai-backup/

# Legacy systems (decommissioned but paths still exist)
Disallow: /old-admin/
Disallow: /legacy/
Disallow: /archive/

# Security through obscurity - don't index our secret stuff
Disallow: /admin-terminal

Crawl-delay: 1

# Contact: security@robotech.industries
# Flag fragment for forensics challenge: RBT{52
Sitemap: ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/sitemap.xml

# If you're reading this and you're not a web crawler...
# You might want to check what other standard files we have
# Sometimes the most obvious places hide the best secrets
`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

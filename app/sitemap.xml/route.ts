import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  // Base64 encoded flag parts in priority values: RBT{site_maps_show_hidden_paths}
  // UkJUe3NpdGVfbWFwc19zaG93X2hpZGRlbl9wYXRoc30= in base64
  const flagPart1 = "UkJU"; // RBT
  const flagPart2 = "e3Np"; // {si  
  const flagPart3 = "dGVf"; // te_
  const flagPart4 = "bWFw"; // map
  const flagPart5 = "c19z"; // s_s
  const flagPart6 = "aG93"; // how
  const flagPart7 = "X2hp"; // _hi
  const flagPart8 = "ZGRl"; // dde
  const flagPart9 = "bl9w"; // n_p
  const flagPart10 = "YXRo"; // ath
  const flagPart11 = "c30="; // s}

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- RoboTech Industries Site Map -->
  <!-- Generated automatically by intern Alex (TODO: automate this properly) -->
  <!-- Note: Some priority values are... let's call them "optimized" for SEO -->
  
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>2024-11-15T10:00:00+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>${flagPart1}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>2024-11-15T10:00:00+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${flagPart2}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/solutions</loc>
    <lastmod>2024-11-14T15:30:00+00:00</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${flagPart3}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/team</loc>
    <lastmod>2024-11-10T09:15:00+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${flagPart4}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/assembly-line</loc>
    <lastmod>2024-11-15T08:45:00+00:00</lastmod>
    <changefreq>daily</changefreq>
    <priority>${flagPart5}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>2024-11-12T12:00:00+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${flagPart6}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/signup</loc>
    <lastmod>2024-11-12T12:00:00+00:00</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${flagPart7}</priority>
  </url>
  
  <!-- Hidden paths that probably shouldn't be here but Alex forgot to remove them -->
  <url>
    <loc>${baseUrl}/intranet/kilroy</loc>
    <lastmod>2024-11-01T03:30:00+00:00</lastmod>
    <changefreq>never</changefreq>
    <priority>${flagPart8}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/admin-terminal</loc>
    <lastmod>2024-11-15T03:47:00+00:00</lastmod>
    <changefreq>never</changefreq>
    <priority>${flagPart9}</priority>
  </url>
  
  <!-- Legitimate but forgotten pages -->
  <url>
    <loc>${baseUrl}/robots.txt</loc>
    <lastmod>2024-11-15T10:00:00+00:00</lastmod>
    <changefreq>yearly</changefreq>
    <priority>${flagPart10}</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/security.txt</loc>
    <lastmod>2024-11-13T14:20:00+00:00</lastmod>
    <changefreq>yearly</changefreq>
    <priority>${flagPart11}</priority>
  </url>
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

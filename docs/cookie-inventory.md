# Cookie Inventory - RoboTech Industries CTF Platform

**Last Updated:** 2025-01-19  
**Platform Version:** Next.js 15.5.2  
**Privacy Compliance:** GDPR, CCPA  
**Status:** ✅ **NO COOKIE CONSENT REQUIRED**

## Overview

This document provides a comprehensive inventory of all cookies and storage mechanisms used by the RoboTech Industries CTF platform for privacy compliance and auditing purposes.

**🎉 Current Status: GDPR Compliant - No Cookie Banner Needed**

The platform uses **essential cookies only** and stores all user data in the database rather than browser localStorage. This eliminates the need for cookie consent under GDPR Article 6(1)(f) legitimate interest.

## Cookie Categories

### 1. Essential Cookies (Always Active)

These cookies are strictly necessary for the website to function and cannot be disabled:

| Cookie Name | Purpose | Source | Duration | HttpOnly | Secure | SameSite |
|-------------|---------|--------|----------|----------|--------|----------|
| `sb-access-token` | Supabase authentication token | Supabase | Session | No | Yes (prod) | Lax |
| `sb-refresh-token` | Token refresh mechanism | Supabase | 7 days | No | Yes (prod) | Lax |
| `sb-provider-token` | OAuth provider tokens | Supabase | Session | No | Yes (prod) | Lax |
| `sb-user` | User session metadata | Supabase | Session | No | Yes (prod) | Lax |

**Legal Basis:** Legitimate interest (essential for service functionality)  
**User Control:** Cannot be disabled (essential cookies)  
**Data Controller:** RoboTech Industries via Supabase  

### 2. Database Storage (No Consent Required)

All user data is stored securely in the PostgreSQL database:

| Data Type | Storage Location | Purpose | Legal Basis |
|-----------|------------------|---------|-------------|
| User Projects | `user_projects` table | Robotics project configurations and progress | Legitimate interest (service provision) |
| User Profiles | `profiles` table | Account information and preferences | Legitimate interest (account management) |
| Challenge Data | `submissions` table | CTF progress and scores | Legitimate interest (service provision) |

**Benefits:**
- ✅ **Cross-device sync** - Available on all devices when logged in
- ✅ **No data loss** - Persistent across browser clearing/reinstalls
- ✅ **Better security** - Database encryption and backup
- ✅ **No consent needed** - Essential for service functionality
- ✅ **GDPR compliant** - Legitimate interest for core features

### 3. No Browser Storage Used

🚫 **localStorage/sessionStorage**: Not used  
🚫 **Functional cookies**: Not used  
🚫 **Analytics cookies**: Not used  
🚫 **Advertising cookies**: Not used  

**Result**: No cookie consent banner required!

## Implementation Details

### Current Architecture (Database-Only)

**Data Flow:**
1. **User Login** → Essential auth cookies set by Supabase
2. **User Actions** → Data saved directly to PostgreSQL database  
3. **Page Load** → Data fetched from database via API routes
4. **Cross-device** → Same data available everywhere when logged in

**API Endpoints:**
- `GET /api/user/projects` - Fetch user's projects from `user_projects` table
- `POST /api/user/projects` - Create new project in database
- `PUT /api/user/projects/[id]` - Update existing project
- `DELETE /api/user/projects/[id]` - Delete project

### Cookie Consent System (Disabled)

The platform includes a complete cookie consent system that is **currently disabled** via feature flags:

```typescript
// lib/featureFlags.ts
cookieConsentEnabled: false  // ❌ DISABLED - only essential cookies used
```

**Available but Unused:**
- Robotics-themed consent banner with terminal animations
- Cookie preferences modal with granular controls
- Consent-aware storage wrapper (`consentedStorage`)
- Complete test suite for consent logic

**To Re-enable** (if localStorage is added in future):
1. Set `cookieConsentEnabled: true` in feature flags
2. Or use environment variable: `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true`

## Third-Party Services

### Supabase (Essential)
- **Purpose:** Authentication and database services
- **Cookies Set:** `sb-*` prefixed cookies
- **Data Controller:** Supabase Inc. (processor for RoboTech Industries)
- **Privacy Policy:** https://supabase.com/privacy
- **Location:** US (with GDPR protections)

## Audit Trail

### 2025-01-19 - Database-Only Architecture Implemented
- ✅ **Database migration**: Updated to use existing `user_projects` table
- ✅ **API routes created**: `/api/user/projects` for CRUD operations
- ✅ **ProjectContext refactored**: Removed localStorage, added database integration
- ✅ **Cookie banner disabled**: Feature flag system implemented
- ✅ **Privacy policy updated**: Reflects database-only approach
- ✅ **Cookie system preserved**: Available for future re-enabling
- ✅ **Documentation updated**: Cookie inventory reflects current state

### GDPR Compliance Status (No Consent Required)

- [x] **Essential cookies only**: No functional/analytics/advertising cookies
- [x] **Database storage**: All user data in PostgreSQL with RLS
- [x] **Legitimate interest**: Essential cookies for authentication
- [x] **Privacy policy**: Clear disclosure of essential cookies
- [x] **No tracking**: No analytics or advertising technologies
- [x] **Cross-device sync**: Better UX than localStorage
- [x] **Data security**: Database encryption and backup
- [x] **User control**: Account deletion removes all data

## Testing Recommendations

### Manual Testing
1. Fresh browser session (private/incognito mode)
2. Verify no functional storage before consent
3. Test banner interaction flow
4. Verify storage behavior after consent/decline
5. Test consent withdrawal via preferences modal

### Automated Testing
- Unit tests: `__tests__/lib/consentedStorage.test.ts`
- Coverage: Consent logic, storage wrapper, error handling
- E2E tests recommended for full user flow

## Contact Information

**Data Protection Officer:** privacy@robotech-industries.com  
**Technical Contact:** support@robotech-industries.com  
**Platform Maintainer:** RoboTech Industries Development Team  

## Legal Notices

This cookie inventory is maintained in compliance with:
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA) 
- ePrivacy Directive (Cookie Law)

Last legal review: 2025-01-19

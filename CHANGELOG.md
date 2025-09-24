# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 📚 Documentation
- **Role & Permission Model**: Added comprehensive documentation section to WARP.md clarifying admin vs dev roles
  - Clear role hierarchy diagram and permission matrix
  - Detailed descriptions of `dev` (super admin), `admin` (limited), and `user` roles
  - Security implementation notes emphasizing server-side enforcement
  - CTF-specific security challenges documentation
  - Code examples for proper permission checking patterns

## [2.1.0] - 2025-01-13 - Team Management System

### 🤝 Added - Project Team Management

#### Team Collaboration Features
- **Multi-member Projects**: Projects can now have up to 3 members working together
- **Project Invitations**: Project leaders can invite other users by exact username
- **One Project Limit**: Users can only be members of one project at a time for focus
- **Leave Project**: Non-lead members can leave projects anytime with confirmation
- **Team Leadership**: Clear project lead designation with special privileges

#### Database Schema Additions
- `project_members` table: Normalized many-to-many relationship between users and projects
- `project_invitations` table: Invitation system with acceptance tracking
- Database constraints: Max 3 members per project, one project per user
- Row-level security policies for secure team operations
- Postgres triggers for automatic `team_members` array synchronization
- Postgres functions for atomic invitation acceptance and project leaving

#### New API Endpoints
- `POST /api/projects/invitations/send` - Send invitation by username (leads only)
- `POST /api/projects/invitations/accept` - Accept received invitation
- `GET /api/projects/invitations` - Get user's invitations (sent/received)
- `POST /api/projects/leave` - Leave current project (non-leads only)

#### Enhanced API Endpoints
- `GET /api/projects` - Now returns detailed team member information with avatars
- `POST /api/projects` - Creates project with automatic membership and leadership setup

#### UI Components Added
- **InvitationModal**: Modal for project leads to invite members with validation
- **TeamMemberList**: Display team members with avatars, names, and lead indicators (⭐)
- **InvitationNotifications**: Show received invitations with one-click accept buttons
- **Assembly Line Integration**: "Invite Member" button for project leads
- **Projects Page Enhancement**: Team member display with leave functionality

#### Frontend Context Updates
- Enhanced `ProjectContext` with invitation management hooks
- New TypeScript interfaces: `TeamMember`, `ProjectInvitation`  
- Team management functions: `sendInvitation`, `acceptInvitation`, `leaveProject`
- Real-time invitation state management with loading states
- Toast notifications for all team operations

### 🔐 Enhanced - Signup Flow
- **Optional Default Project**: Added checkbox to create default project during signup (checked by default)
- Signup validation updated to support `createDefaultProject` boolean field
- Refactored project creation helper for better modularity
- Default project creation properly integrates with new team system
- Backwards compatibility maintained for existing users

### 🛡️ Security Improvements
- Comprehensive Row-Level Security (RLS) policies for all team operations
- Server-side validation for all invitation and membership operations  
- Input validation using Zod schemas for type safety and XSS prevention
- Proper authentication checks for all team management endpoints
- Project lead verification for sensitive operations
- Rate limiting on invitation sending to prevent spam

### ✅ Testing & Quality
- Comprehensive unit tests for all new API routes (`__tests__/api/invitations.test.ts`)
- Test coverage for signup with default project creation
- Mocked Supabase integration for reliable testing
- Edge case testing: full teams, duplicate invitations, invalid users
- Authentication and authorization testing
- Database constraint validation

### 📚 Documentation
- Updated `supabase/README.md` with complete team management documentation
- API endpoint documentation with request/response examples  
- Database schema documentation with migration instructions
- Row-level security policy explanations
- Frontend integration guides and component usage

### 🔄 Migration Guide

#### Database Migration Required
```bash
# Run this SQL script in your Supabase SQL Editor:
# scripts/add_project_invitations.sql
```

#### Breaking Changes
- `user_projects` table now requires team membership setup (handled automatically)
- Users are limited to one project membership at a time
- Project creation automatically creates team membership entry

#### Frontend Updates
- `ProjectContext` now includes additional team management functions
- New UI components available for team functionality  
- Enhanced project data structure with `teamMemberDetails` field
- Invitation notifications appear automatically for invited users

## [2.0.1] - Next.js 15 & Dependencies Upgrade

### 🎯 New Features

#### Team Page CTF Role Hierarchy System
- **CTF Role Badges**: Added prominent role badges to distinguish team members
  - `app/components/CTFRoleBadge.tsx` - New reusable component with group-based styling
  - **Core CTF Team** (gold gradient): Challenge Architect, Exploitation Officer, Shadow Ops Commander
  - **North Star Agi Team** (indigo/purple gradient): Business, AI Strategy, People & Ethics, Robotics, Security
  - **CTF Participants** (emerald gradient): Default role for all registered users
- **Database Integration**: Added `ctf_role` column to profiles table with migration
  - Migration: `supabase/migrations/20250910095623_add_ctf_role_column.sql`
  - Updated API routes to include CTF role data
- **Accessibility & UX**: 
  - Hover animations with scale transforms
  - Responsive text sizing (`text-sm md:text-base`)
  - Full ARIA support with labels and titles
  - Icon + text display with proper spacing
- **Testing**: Comprehensive unit tests in `__tests__/CTFRoleBadge.test.tsx`
  - Group classification validation
  - CSS styling verification
  - Accessibility compliance checks

#### Password Reset Flow Implementation
- **Secure Password Reset**: Complete email-based password recovery system
  - `app/forgot-password/page.tsx` - Request password reset with email validation
  - `app/reset-password/page.tsx` - Token validation and password update form
  - `app/api/auth/reset-password/route.ts` - Server-side reset request handling
- **AuthContext Integration**: Extended authentication context with new methods
  - `requestPasswordReset(email)` - Client-side password reset request
  - `updatePassword(newPassword)` - Secure password update with validation
- **Security Features**:
  - Email enumeration protection (generic responses)
  - Rate limiting on password reset requests
  - Comprehensive input validation and sanitization
  - Server-side logging and audit trail
  - Environment-based redirect URL configuration
- **User Experience**:
  - Responsive form design with loading states
  - Clear error messaging and success feedback
  - Password strength requirements with real-time validation
  - Automatic redirect to login after successful reset
- **Navigation**: Added "Forgot Password?" link to login page

### 🔒 Security Enhancements

#### Timing Attack Mitigation
- **Password Comparison**: Implemented timing-safe string comparison for password validation
  - `lib/security/timingSafeCompare.ts` - New cryptographic utility using Node.js `crypto.timingSafeEqual`
  - Prevents timing attacks by ensuring constant-time string comparisons
  - Fixed vulnerable comparisons in:
    - Password reset form validation (`app/reset-password/page.tsx`)
    - Zod authentication schema (`lib/validation/auth.ts`)
- **Security Features**:
  - UTF-8 buffer conversion with proper padding for equal-length comparison
  - Cryptographically secure comparison that doesn't leak timing information
  - Comprehensive error handling with security-first defaults
  - Extensive JSDoc documentation for future contributors
- **Testing**: Complete test coverage in `__tests__/security/timingSafeCompare.test.ts`
  - Unit tests for equal/different strings of same and different lengths
  - Timing attack resistance validation with statistical analysis
  - Edge case handling (Unicode, null bytes, very long strings)
  - Security property verification (determinism, reflexivity, symmetry)

#### Security Headers Enforcement
- **Comprehensive Header Coverage**: Fixed missing security headers identified by dynamic scanning
  - **Content Security Policy (CSP)**: Now applied to ALL requests including redirects
  - **X-Frame-Options**: Proper clickjacking protection on all routes  
  - **X-Content-Type-Options**: MIME type sniffing prevention across entire application
- **Middleware Enhancement**: Consolidated all security headers in middleware for better coverage
  - Covers pages, API routes, static files, and redirect responses
  - Eliminated duplication between Next.js config and middleware
  - Helper function `applySecurityHeaders()` ensures consistency
- **Dynamic Scanning Fixes**: Resolved all three issues reported by security scanning tools:
  - ✅ Missing Content Security Policy header
  - ✅ Missing clickjacking protection  
  - ✅ Browser content sniffing allowed
- **Testing**: Complete integration tests in `__tests__/security/headers.test.ts`
  - 30 test cases covering all security headers across route types
  - Redirect response header validation
  - Environment-specific behavior (HSTS in production only)
  - CSP directive security validation
- **Development Tools**: Added `scripts/test-headers.js` for manual header verification

### 🚀 Major Version Upgrades

#### Framework & Runtime
- **Next.js**: 14.2.32 → 15.5.2 (major version upgrade)
- **React**: 18.3.1 → 19.1.1 (major version upgrade) 
- **React DOM**: 18.3.1 → 19.1.1 (major version upgrade)
- **Node.js**: Locked to ≥20.19.4 (added `.nvmrc` and engine requirements)

#### Styling & Build Tools  
- **TailwindCSS**: 3.4.17 → 4.1.12 (major version upgrade with new v4 architecture)
- **PostCSS**: 8.4.38 → 8.5.6
- **Autoprefixer**: 10.4.19 → 10.4.21
- **TypeScript**: Already on 5.9.2 (compatible with Next.js 15)

#### Testing & Linting
- **ESLint**: 8.57.1 → 9.34.0 (major version upgrade)
- **Jest**: 29.7.0 → 30.1.2 (major version upgrade)
- **babel-jest**: 30.1.1 → 30.1.2
- **jest-environment-jsdom**: 30.1.1 → 30.1.2
- **ts-jest**: 29.1.5 → 29.4.1

#### Type Definitions
- **@types/jest**: 29.5.12 → 30.0.0
- **@types/node**: 20.12.12 → 24.3.0  
- **@types/react**: 18.3.3 → 19.1.12
- **@types/react-dom**: 18.3.0 → 19.1.9

#### Other Dependencies
- **zod**: 4.1.3 → 4.1.5
- **@supabase/supabase-js**: Already on latest (2.56.1)
- **@supabase/ssr**: Already on latest (0.7.0)

### 🔧 Breaking Changes Fixed

#### Next.js 15 API Changes
- **Route Parameters**: Updated dynamic route handlers to handle Promise-based `params`
  - Fixed `/api/admin/projects/[projectName]/route.ts` to await route params
- **Cookies API**: Updated `cookies()` to handle Promise-based return value
  - Added temporary sync wrapper `createClientSync` for Supabase integration
  - Server-side cookie handling now properly awaits the cookies Promise

#### TailwindCSS v4 Architecture Changes  
- **PostCSS Plugin**: TailwindCSS v4 moved PostCSS plugin to separate package
  - Installed `@tailwindcss/postcss` package
  - Updated `postcss.config.js` to use new plugin architecture
  - Maintains full backward compatibility for existing styles
- **Configuration Migration**: Updated CSS-based configuration for v4 compatibility
  - Replaced `@tailwind` directives with `@import "tailwindcss"`
  - Added `@theme` directive with custom color definitions
  - Replaced `@apply` directives with raw CSS values for full v4 compatibility
  - Removed JavaScript-based `tailwind.config.ts` (v4 uses CSS configuration)
  - Fixed "unknown utility class" errors in development

### 🛠 Configuration Updates

#### Build & Development
- Added `.nvmrc` file specifying Node.js 20.19.4
- Updated `package.json` engines to require Node.js ≥20.19.4 and npm ≥10.0.0
- Updated PostCSS configuration for TailwindCSS v4 compatibility

#### Migration Documentation
- Created `docs/dependency-baseline.md` with pre-upgrade package versions
- Created `docs/next15-migration-log.md` with compilation logs
- Git tagged `pre-upgrade-nextjs14` for easy rollback reference

### ✅ Compatibility & Testing

#### Build Status
- ✅ `npm run build` compiles successfully
- ✅ All production builds generate correctly
- ✅ Static page generation working
- ✅ API routes compile without errors
- ⚠️ Minor linting warnings remain (cosmetic only)

#### Known Issues
- Some TypeScript compilation errors in test files due to type updates
- Test suite requires updates for Next.js 15 and React 19 compatibility
- TailwindCSS v4 shows minor utility class warnings (non-blocking)

#### CTF Security Features
- ✅ All intentionally vulnerable routes preserved
- ✅ Security middleware still functional  
- ✅ Rate limiting systems operational
- ✅ Authentication flows working
- ✅ Supabase integration maintained

### 🔄 Migration Path

This upgrade maintains full backward compatibility for:
- All existing CTF challenges and vulnerabilities
- User authentication and session management
- Admin terminal and project browsing features
- API security testing endpoints
- All styling and UI components

### 📋 Next Steps

The following items require attention in future development:
- [ ] Fix TypeScript test file compatibility with React 19 types
- [ ] Update Jest test mocks for Next.js 15 Request/Response types  
- [ ] Migrate from temporary `createClientSync` to full async Supabase client
- [x] Address TailwindCSS v4 utility class deprecation warnings ✅ FIXED
- [ ] Update CI/CD pipelines to use Node.js 20.19.4

### 🎯 Impact Summary

This major upgrade successfully modernizes the CTF platform with:
- **Latest React 19** features and performance improvements
- **Next.js 15** App Router enhancements and better DX
- **TailwindCSS v4** next-generation styling architecture  
- **Modern tooling** with ESLint v9 and Jest v30
- **Type safety** with latest TypeScript definitions
- **Zero functionality regression** - all CTF features preserved

The platform is now running on the latest stable versions of all major dependencies while maintaining full compatibility with existing security challenges and educational content.

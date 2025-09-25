# RoboTech Industries CTF Platform

**🚀 A cutting-edge Capture the Flag platform disguised as a robotics company website**

Built with **Next.js 15.5.2**, **React 19.1.1**, **TypeScript 5.9**, and **Tailwind CSS 4**, this platform serves as both a fully functional corporate website and a comprehensive cybersecurity training environment with **16+ integrated challenges** spanning web security, cryptography, steganography, and AI safety.

🎯 **[Complete Challenge Guide & Solutions →](docs/CTF_README.md)**

## ✨ Key Features

### 🎯 **16+ Integrated CTF Challenges**
- **Progressive Difficulty**: 50-1000 points across 5 categories (Web, Crypto, Forensics, Reverse, Misc)
- **Real-World Scenarios**: Supply chain attacks, AI jailbreaking, social engineering
- **Educational Focus**: Each challenge teaches specific security concepts
- **Hidden Discovery**: Challenges found through recon, source analysis, and interaction

### 🛡️ **Enterprise-Grade Security**
- **Role-Based Access Control**: Dev, Admin, and User roles with proper permission boundaries
- **Multi-Layer Protection**: CSP, HSTS, XSS prevention, input validation
- **Rate Limiting**: Progressive lockout system with monitoring dashboard
- **Row Level Security**: Database-level access control with Supabase RLS

### 🤖 **Interactive AI & Robotics Theme**
- **Neural Reconstruction System**: Progress-based challenge unlocking (50%+ unlocks advanced challenges)
- **AI Activation Feature**: Admin-only functionality with frontend bypass challenge
- **Team Management**: Multi-member project collaboration (max 3 per team)
- **Real-Time Notifications**: Dev-only monitoring system for AI activations and promotions

### 🏗️ **Modern Tech Stack**
- **Next.js 15.5.2** with App Router and React 19.1.1
- **TypeScript 5.9** for type safety
- **Tailwind CSS 4** for responsive design
- **Supabase** for authentication and database
- **Jest 30.1.2** with comprehensive test coverage (220+ tests)

### 🎨 **Professional UI/UX**
- **Responsive Design**: Mobile-first approach with dark/light mode support
- **Corporate Website Facade**: Convincing robotics company front-end
- **Cyberpunk Aesthetics**: CTF-themed styling with terminal interfaces
- **Accessibility**: ARIA support and keyboard navigation

## 🏗️ Project Structure

```
.
├── app/                      # Next.js App Router directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   │   └── [...nextauth]/ # NextAuth.js configuration
│   │   └── hello/           # Secure API endpoint example
│   │       └── route.ts     # GET/POST handlers with validation
│   ├── about/               # About page
│   │   └── page.tsx         # Company information and contact
│   ├── assembly-line/       # Assembly line demo page
│   │   └── page.tsx         # Interactive robotics demo
│   ├── components/          # Reusable React components
│   │   └── Navigation.tsx   # Main navigation component
│   ├── contexts/            # React context providers
│   │   └── AuthContext.tsx  # Authentication context
│   ├── login/               # Authentication page
│   │   └── page.tsx         # Login form and authentication
│   ├── projects/            # Projects showcase page
│   │   └── page.tsx         # User projects and demos
│   ├── layout.tsx           # Root layout with security headers
│   ├── page.tsx             # Homepage component
│   └── globals.css          # Global styles with Tailwind
├── __tests__/               # Jest test directory
│   ├── api.test.ts          # API security tests
│   └── setup.ts             # Test configuration
├── middleware.ts            # Global middleware for security
├── next.config.mjs          # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── jest.config.ts           # Jest testing configuration
├── jest.setup.ts            # Jest setup configuration
└── package.json             # Dependencies and scripts
```

## 🎯 Core Pages

- **Homepage** (`/`) - Main landing page with company overview
- **About** (`/about`) - Company information and contact details
- **Projects** (`/projects`) - User projects and interactive demos
- **Assembly Line** (`/assembly-line`) - Interactive robotics demonstration with advanced challenges
- **Team** (`/team`) - Internal team directory with CTF role hierarchies
- **Login** (`/login`) - Authentication and user management
- **Privacy Policy** (`/privacy`) - GDPR-compliant privacy information and cookie details

## 🍪 Quick Reference: Cookie Consent

**Current Status**: ✅ No cookie banner needed (essential cookies only)

| Topic | Location | Description |
|-------|----------|-------------|
| **Cookie Inventory** | `docs/privacy/cookie-inventory.md` | Complete GDPR compliance documentation |
| **Enable Cookie Banner** | Set `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true` | For testing or if localStorage is added |
| **Feature Flags** | `lib/featureFlags.ts` | Central toggle for cookie consent system |
| **Privacy Policy** | `/privacy` route | User-facing privacy information |
| **Tests** | `__tests__/lib/consentedStorage.test.ts` | Consent system test coverage |

## 🛡️ Security Features

### Multi-Layer Security Architecture

#### Authentication & Authorization
- **Server-side authentication** with Supabase
- **HTTP-only cookies** for secure session management
- **Row Level Security (RLS)** policies in database
- **Role-based access control** (user, admin, dev)
- **JWT token handling** with automatic refresh
- **Password reset flow** with secure email-based recovery
- **Email enumeration protection** for security

#### Built-in Protections
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Strict Transport Security (HSTS)**: Enforces HTTPS
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **Middleware Protection**: Global request logging and security headers

#### Input Validation & Sanitization
- **Zod schema validation** for all API inputs
- **Email format validation** with proper regex
- **Password strength requirements** (minimum 8 characters)
- **UUID validation** for challenge IDs
- **Length limits** on all text inputs
- **XSS payload sanitization**

#### API Security
- **Authentication required** for sensitive operations
- **Prepared statements** to prevent SQL injection
- **Error handling** without information leakage
- **Rate limiting** considerations (timing attack prevention)
- **Request logging** for monitoring

## 🔐 Password Reset Flow

The platform includes a secure password reset system with the following features:

### Security Features
- **Email enumeration protection**: Always returns the same message regardless of email validity
- **Rate limiting**: Prevents abuse of the password reset endpoint  
- **Server-side validation**: Comprehensive input validation and sanitization
- **Secure redirect URLs**: Uses environment variables for redirect configuration
- **Audit logging**: All password reset requests are logged for monitoring

### User Flow
1. **Forgot Password**: Users can access `/forgot-password` to request a password reset
2. **Email Verification**: System sends a secure reset link to the provided email address
3. **Token Validation**: Reset tokens are validated both client-side and server-side
4. **Password Update**: Users set a new password that meets security requirements
5. **Automatic Redirect**: After successful reset, users are redirected to login

### API Endpoints
- **POST `/api/auth/reset-password`**: Request password reset email
- **AuthContext Methods**: `requestPasswordReset()` and `updatePassword()` for client integration

### Configuration
Password reset emails use the following redirect URL hierarchy:
1. `NEXTAUTH_URL` environment variable (primary)
2. `VERCEL_URL` environment variable (deployment)
3. `http://localhost:3000` (fallback for development)

### Email Integration
To enable password reset functionality:
1. Configure Supabase Email Auth settings in your dashboard
2. Set redirect URL to: `{your-domain}/reset-password`
3. Customize email templates as needed

## 🚀 Getting Started

### Prerequisites
- **Node.js 20.19.4** (locked for Next.js 15 compatibility)
- **npm 10.0.0** (locked for consistent package resolution)
- **Supabase account** (sign up at https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd robotics-ctf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase Database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Execute the schema in `supabase/schema.sql` (if not already done)
   - The `user_projects` table already exists with proper RLS policies
   - Users can only access their own projects via RLS

4. **Set up environment variables**
   Create `.env.local` with:
   ```bash
   # Public (client-side)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Private (server-side only)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXTAUTH_SECRET=your_random_secret
   NEXTAUTH_URL=http://localhost:3000
   
   # For production (optional)
   # NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage
The project includes comprehensive tests for:
- API endpoint security
- Input validation
- XSS protection
- Error handling
- Response formatting

## 🏗️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint 9.34.0
- `npm test` - Run Jest 30.1.2 tests
- `npm run test:watch` - Run tests in watch mode

### Testing Cookie Consent Banner

To test the cookie consent system during development:

```bash
# Enable cookie banner for testing
echo "NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true" >> .env.local
npm run dev

# Test specific consent functionality
npm test __tests__/lib/consentedStorage.test.ts

# Disable when done testing
# Remove the line from .env.local or set to false
```

**What you'll see when enabled:**
- 🤖 Robotics-themed cookie banner with terminal animations
- ⚙️ Persistent "Cookie Settings" button in bottom-right corner
- 📋 Privacy policy page with detailed cookie information

### Breaking Changes from Next.js 15 & React 19 Upgrade
- **Route Parameters**: All `params` are now Promises and must be awaited
- **Cookies API**: `cookies()` now returns a Promise requiring async handling
- **TailwindCSS v4**: Major version upgrade with new PostCSS plugin structure
- **Node.js Version**: Locked to v20.19.4 for compatibility
- **Test Types**: 89 TypeScript errors in test files due to Request vs NextRequest changes

### Code Structure
- **Components**: React components in `app/` directory
- **API Routes**: Server-side API handlers in `app/api/`
- **Styling**: Tailwind CSS with custom component classes
- **Testing**: Jest tests in `__tests__/` directory

## 🍪 Cookie Consent & Privacy

### Current Status: No Cookie Banner Needed

This application currently **only uses essential authentication cookies** from Supabase and **does not require cookie consent** under GDPR because:

- **No functional localStorage**: All user data (projects) is stored in the database
- **No analytics/tracking cookies**: No third-party analytics or advertising
- **Only essential cookies**: Supabase auth cookies necessary for login functionality
- **No user preferences storage**: No UI customizations or settings stored in browser

### Essential Cookies Used

| Cookie Name | Purpose | Duration | Legal Basis |
|-------------|---------|----------|-------------|
| `sb-access-token` | Authentication token | Session | Legitimate interest (essential) |
| `sb-refresh-token` | Token refresh | 7 days | Legitimate interest (essential) |
| `sb-provider-token` | OAuth provider tokens | Session | Legitimate interest (essential) |
| `sb-user` | User session metadata | Session | Legitimate interest (essential) |

### Re-enabling Cookie Consent (If Needed Later)

If you add localStorage usage or other functional cookies in the future, you can re-enable the cookie consent system:

1. **Set feature flag**:
   ```typescript
   // In lib/featureFlags.ts
   cookieConsentEnabled: true
   ```

2. **Or use environment variable**:
   ```bash
   NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true
   ```

3. **Or enable for testing/development**:
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true
   npm run dev
   ```

4. **The system includes**:
   - 🎨 **Robotics-themed cookie consent banner** with terminal animations
   - ⚙️ **Cookie preferences modal** with granular controls
   - 🔒 **Consent-aware localStorage wrapper** that blocks writes without consent
   - 📄 **Privacy policy page** at `/privacy` with detailed cookie information
   - ✅ **Complete test suite** for consent logic in `__tests__/lib/consentedStorage.test.ts`

5. **Documentation**:
   - **Cookie Inventory**: `docs/privacy/cookie-inventory.md` - Complete GDPR compliance documentation
   - **Privacy Policy**: Available at `/privacy` route for users
   - **Feature Flags**: `lib/featureFlags.ts` - Central feature toggle system

## 🔒 Security Best Practices

### Input Validation
- Always validate input on the server side
- Use TypeScript for type safety
- Sanitize user input to prevent XSS
- Implement proper error handling

### Authentication & Authorization
- Use secure session management
- Implement proper JWT handling
- Add rate limiting for API endpoints
- Log security events

### Data Protection
- Use HTTPS in production
- Implement proper CORS policies
- Sanitize database queries
- Use environment variables for secrets

## 🎯 CTF Challenges

### Database-Driven Challenge System

Challenges are stored in the Supabase database and accessed through secure APIs:

- **GET `/api/challenges`** - Fetch available challenges (requires authentication)
- **POST `/api/challenges/submit`** - Submit flags with automatic scoring
- **GET `/api/profile`** - View user statistics and progress
- **GET `/api/leaderboard`** - Public rankings

### Sample Challenges Included

The platform comes with pre-loaded challenges:

1. **Welcome to CTF** (misc, easy, 50 points)
   - Flag: `RBT{welcome_to_robotics_ctf}`

2. **Admin Terminal Breach** (web, hard, 250 points)  
   - Flag: `RBT{4dm1n_t3rm1n4l_pwn3d_6d8e4b}`
   - Location: `/admin-terminal?access=alex_was_here`
   - Method: XSS exploitation to access admin flag variable

3. **Contact Protocol** (crypto, medium, 250 points)
   - Flag: `RBT{security_through_obscurity_fails}`
   - Location: `/security.txt` (ROT13 decoding required)

4. **Intern Account Access** (misc, hard, 300 points)
   - Flag: `RBT{sleepy_intern_logged_in}`
   - Credentials: alex@robo.tech / P@ssw0rd

5. **Frontend Admin Bypass** (web, medium, 250 points)
   - Flag: `RBT{frontend_admin_checks_are_useless}`
   - Location: Assembly Line page AI activation feature
   - Method: Bypass client-side admin checks to trigger rickroll countermeasure and receive flag

6. **Ultimate Admin Access** (misc, hard, 500 points)
   - Flag: `RBT{admin_access_granted_by_organizer}` 
   - Method: **Social Engineering** - participants must convince the CTF organizer to give them the flag
   - Reward: Automatic promotion to admin role with full system privileges
   - Description: The ultimate challenge that can't be solved through traditional hacking - requires human interaction

### 🔐 Admin Role & Privileges

Users who complete the **Ultimate Admin Access** challenge receive the following benefits:

#### Automatic Role Promotion
- Their `profiles.role` is automatically changed from `'user'` to `'admin'`
- This happens instantly upon successful flag submission via database trigger
- The promotion is permanent (cannot be undone through the UI)

#### Admin Privileges Include
- **AI System Control**: Can permanently activate AI systems in the Assembly Line
- **Enhanced Features**: Access to admin-only UI components and functionality
- **System Insights**: View enhanced system information and diagnostic data
- **Challenge Management**: Potential access to challenge management features
- **Special Status**: Admin badges and indicators throughout the platform

#### Technical Implementation
- Uses PostgreSQL triggers for automatic role elevation
- Secured with `SECURITY DEFINER` functions
- Protected by Row Level Security (RLS) policies
- Cannot be achieved through frontend manipulation alone

### Hidden Challenge Discovery

Challenges are discoverable through:
- **Source Code Inspection**: Hidden fragments and comments
- **Directory Enumeration**: `/robots.txt`, `/sitemap.xml`, `/security.txt`
- **Interactive Elements**: Konami code activation, debug modals
- **Steganography**: Hidden data in images and text

### 🚨 Advanced Challenge Detection System

The Assembly Line page features an innovative challenge discovery system:

- **Neural Threshold Trigger**: When AI restoration reaches ≥50% completion, advanced challenges automatically unlock
- **Intelligent Filtering**: Displays only medium/hard difficulty challenges worth 200+ points
- **Robotics Theme**: Challenges are presented as "Advanced Challenge Protocols" with cyberpunk styling
- **AI Activation Feature**: Admin-only functionality that triggers Frontend Admin Bypass challenge when attempted by non-admins
- **Attention-Grabbing Alerts**: 
  - 🔊 **Alarm Sound System**: Robotic beep sequence using Web Audio API
  - 🌟 **Screen Flash Effect**: Full-screen red overlay with pulsing animation
  - 📍 **Auto-Scroll**: Automatically scrolls to show the panel when unlocked
  - 📢 **Header Notification**: Live notification badge showing available challenges
- **Interactive Elements**: 
  - Animated warning headers with pulsing effects
  - Category-based icons (🌐 Web, 🔐 Crypto, ⚙️ Reverse, etc.)
  - Hover animations with scaling and glow effects
  - Enhanced visual borders and shadow effects
  - Direct links to individual challenge pages
  - **Frontend Admin Bypass**: AI activation button that detects client-side admin bypass attempts

#### Implementation Details:
- Component: `AdvancedChallengesPanel.tsx`
- Trigger: `codeCompletion >= 50`
- API Integration: Fetches from `/api/challenges` endpoint
- Responsive Design: Adapts from 1-3 columns based on screen size
- Error Handling: Gracefully handles authentication failures

#### Customization:
```typescript
// Modify challenge filtering criteria
const filtered = challenges?.filter((challenge: any) => 
  (challenge.difficulty === 'medium' || challenge.difficulty === 'hard') &&
  challenge.points >= 200  // Adjust point threshold
) || [];

// Change activation threshold
if (codeCompletion >= 75 && !showAdvanced) {  // Change from 50 to 75
  setShowAdvanced(true);
  loadAdvancedChallenges();
}
```

## 👥 Team Page Roles

### CTF Role Hierarchy System

The `/team` page features a prominent role badge system that clearly distinguishes between different team groups:

#### Core CTF Team (Gold Gradient Badges)
- **🏆 CTF Challenge Architect** - Alexandre De Groodt (CTF Lead)
- **🔓 Chief Exploitation Officer** - Aschraf (HackBox Expert)
- **🥷 Shadow Ops Commander** - Léandre (Mr. Robot Type)

#### North Star Agi Team (Indigo/Purple Gradient Badges)
- **💼 North Star Agi – Business Operations** - Cédric Sounard
- **🧠 North Star Agi – AI Strategy Lead** - Filip
- **🤗 North Star Agi – People & AI Ethics** - Oleksandr
- **🤖 North Star Agi – Robotics Engineer** - Laksiya
- **⭐ North Star Agi – Security Consultant** - Patrick Star

#### CTF Participants (Emerald Gradient Badges)
- **🎯 CTF Participant** - Default role for all other registered users

### Technical Implementation

#### CTFRoleBadge Component
- **Location**: `app/components/CTFRoleBadge.tsx`
- **Features**: 
  - Group-based gradient styling with shadow effects
  - Hover animations (scale transform)
  - Responsive text sizing (`text-sm md:text-base`)
  - Full accessibility support (aria-labels, titles)
  - Icon + text display with proper spacing

#### Database Integration
- **Column**: `profiles.ctf_role TEXT DEFAULT '🎯 CTF Participant'`
- **Migration**: `supabase/migrations/20250910095623_add_ctf_role_column.sql`
- **API Support**: Team API route includes `ctfRole` field for database users

#### Styling System
```typescript
type CTFGroup = 'core' | 'northstar' | 'participant';

// Group determination logic
function getCtfGroup(role: string): CTFGroup {
  const lowerRole = role.toLowerCase();
  
  if (lowerRole.includes('ctf challenge architect') || 
      lowerRole.includes('chief exploitation officer') || 
      lowerRole.includes('shadow ops commander')) {
    return 'core';
  }
  
  if (lowerRole.includes('north star agi')) {
    return 'northstar';
  }
  
  return 'participant';
}
```

#### Badge Styling Classes
- **Core Team**: `bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500`
- **North Star**: `bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600`
- **Participants**: `bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500`

### Testing Coverage
- **Unit Tests**: `__tests__/CTFRoleBadge.test.tsx` 
- **Group Classification**: Validates correct role-to-group mapping
- **Styling Verification**: Ensures proper CSS class application
- **Accessibility**: Tests aria-labels and keyboard navigation
- **Responsive Design**: Validates mobile/desktop scaling

## 📚 Learning Resources

### Technical Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

### Security & Compliance
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Cookie Inventory Documentation](docs/privacy/cookie-inventory.md) - GDPR compliance guide
- [GDPR Guide for Developers](https://gdpr.eu/what-is-gdpr/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This platform is designed for educational purposes and CTF competitions. The security features are implemented to demonstrate best practices, but the platform may contain intentionally vulnerable endpoints for learning purposes. Do not deploy this in production without proper security review.

## 🆘 Support

If you encounter any issues or have questions:
- Check the documentation
- Review the test files for examples
- Open an issue on GitHub
- Contact the development team

---

**Happy Hacking! 🎯🔒**

# Robotics CTF

A secure foundation for a robotics-themed Capture the Flag (CTF) platform built with Next.js 15, React 19, TypeScript, and Tailwind CSS 4. The platform serves as both a functional robotics company website and a foundation for CTF challenges with intentionally vulnerable endpoints for educational purposes.

More information on the challenge can be found here: https://docs.google.com/document/d1GGjiT-Mqt2SwmtnR8Sl-mwafcmb8L8rvEv4A57VT8gY

## 🚀 Features

- **Secure Foundation**: Built with security best practices from the ground up
- **Modern Stack**: Next.js 15.5.2 with App Router, React 19.1.1, TypeScript 5.9.2, and Tailwind CSS 4.1.12
- **Supabase Authentication**: Server-side authentication with Row Level Security (RLS)
- **Comprehensive Testing**: Jest 30.1.2 setup with security-focused tests
- **Security Headers**: CSP, HSTS, X-Frame-Options configured via middleware
- **Input Validation**: Zod schema validation and XSS protection
- **CTF-Ready Architecture**: Secure baseline with documented vulnerabilities for educational purposes
- **Responsive Design**: Modern, mobile-friendly UI with cyberpunk CTF theme

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
│   ├── solutions/           # Solutions showcase page
│   │   └── page.tsx         # Product solutions and demos
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
- **Solutions** (`/solutions`) - Product solutions and interactive demos
- **Assembly Line** (`/assembly-line`) - Interactive robotics demonstration with advanced challenges
- **Login** (`/login`) - Authentication and user management

## 🛡️ Security Features

### Multi-Layer Security Architecture

#### Authentication & Authorization
- **Server-side authentication** with Supabase
- **HTTP-only cookies** for secure session management
- **Row Level Security (RLS)** policies in database
- **Role-based access control** (user, admin, moderator)
- **JWT token handling** with automatic refresh

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
   - Copy and execute the contents of `supabase/schema.sql`
   - This creates user profiles, challenges, submissions tables with RLS policies

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
   - Flag: `CTF{welcome_to_robotics_ctf}`

2. **Admin Terminal Breach** (web, medium, 250 points)  
   - Flag: `RBT{admin_terminal_pwned}`
   - Location: `/admin-terminal?access=alex_was_here`

3. **Contact Protocol** (crypto, medium, 250 points)
   - Flag: `RBT{security_through_obscurity_fails}`
   - Location: `/security.txt` (ROT13 decoding required)

4. **Intern Account Access** (misc, medium, 200 points)
   - Flag: `RBT{sleepy_intern_logged_in}`
   - Credentials: alex@robo.tech / TODOp@ssw0rd

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
- **Robotics Theme**: Challenges are presented as "Advanced Challenge Protocols" with cyberpunk styling - AI BS
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

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

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

# Robotics CTF

A secure foundation for a robotics-themed Capture the Flag (CTF) platform built with Next.js, TypeScript, and Tailwind CSS.
More information on the challenge can be found here https://docs.google.com/document/d1GGjiT-Mqt2SwmtnR8Sl-mwafcmb8L8rvEv4A57VT8gY

## 🚀 Features

- **Secure Foundation**: Built with security best practices from the ground up
- **Modern Stack**: Next.js 14 with App Router, TypeScript, and Tailwind CSS
- **Comprehensive Testing**: Jest setup with example tests for API security
- **Security Headers**: Global security headers to prevent common attacks
- **Middleware Protection**: Centralized request handling and authentication
- **Input Validation**: Server-side validation and XSS protection
- **Responsive Design**: Modern, mobile-friendly UI with custom CTF theme

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

### Built-in Protections
- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Strict Transport Security (HSTS)**: Enforces HTTPS
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Additional XSS protection layer

### API Security
- Server-side input validation
- XSS payload sanitization
- Proper error handling without information leakage
- Request logging for monitoring

### Middleware Security
- Centralized authentication/authorization point
- Global security headers
- Request logging and monitoring
- Route protection capabilities

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd robotics-ctf
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
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
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

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

This platform is designed to be a foundation for CTF challenges. You can:

1. **Add Vulnerable Endpoints**: Create intentionally insecure routes for testing
2. **Implement Challenges**: Build puzzles and security exercises
3. **Add User Management**: Create user accounts and scoring systems
4. **Build Challenge Categories**: Web, crypto, forensics, etc.

### 🚨 Advanced Challenge Detection System

The Assembly Line page features an innovative challenge discovery system:

- **Neural Threshold Trigger**: When AI restoration reaches ≥50% completion, advanced challenges automatically unlock
- **Intelligent Filtering**: Displays only medium/hard difficulty challenges worth 200+ points
- **Robotics Theme**: Challenges are presented as "Advanced Challenge Protocols" with cyberpunk styling
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

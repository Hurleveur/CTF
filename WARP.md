# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Robotics-themed Capture the Flag (CTF) platform** built with Next.js 14, TypeScript, and Tailwind CSS. The platform serves as both a functional robotics company website and a foundation for CTF challenges. The application features secure foundations with intentionally vulnerable endpoints for educational purposes.

## Essential Development Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode (for continuous development)
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run a single test file
npm test __tests__/api.test.ts
```

### Package Management
```bash
# Install dependencies
npm install

# Add new dependency
npm install <package-name>

# Add development dependency
npm install -D <package-name>
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest with jsdom environment
- **Security**: Custom middleware + built-in Next.js security headers

### Key Architectural Patterns

#### 1. **App Router Structure**
The application uses Next.js App Router with a clear separation of concerns:
- `app/` - Main application directory with co-located components
- `app/api/` - API routes with server-side validation
- `app/components/` - Reusable React components
- `app/contexts/` - React context providers for state management

#### 2. **Security-First Design**
Multi-layered security approach:
- **Middleware**: Global request logging and security headers (`middleware.ts`)
- **API Security**: Server-side validation, XSS prevention, input sanitization
- **Headers**: CSP, HSTS, X-Frame-Options configured in `next.config.mjs`
- **Authentication**: Context-based auth with localStorage persistence

#### 3. **CTF-Ready Architecture**
The codebase is structured to support CTF challenges:
- Secure baseline with documented security measures
- Example vulnerable endpoints for educational purposes
- Comprehensive test coverage for security scenarios
- Clear separation between secure and potentially vulnerable code

### Core Components

#### Navigation System (`app/components/Navigation.tsx`)
- Responsive navigation with mobile menu
- Authentication-aware UI (login/logout states)
- Centralized navigation logic for all pages

#### Authentication (`app/contexts/AuthContext.tsx`)
- Client-side authentication context
- Simple credential validation (admin@example.com/admin)
- localStorage-based session persistence
- React hooks for authentication state

#### API Security (`app/api/hello/route.ts`)
- Demonstrates secure API patterns
- Input validation and sanitization
- XSS payload filtering
- Proper error handling without information leakage

### Page Structure
- **Homepage** (`/`) - Company landing page
- **About** (`/about`) - Company information
- **Solutions** (`/solutions`) - Product showcase
- **Assembly Line** (`/assembly-line`) - Interactive robotics demo
- **Login** (`/login`) - Authentication interface

## Development Guidelines

### Security Testing
The project includes comprehensive security tests in `__tests__/api.test.ts`:
- Valid request handling
- Input validation testing
- XSS payload sanitization
- Error handling verification

### Adding New Features
1. Follow the existing TypeScript patterns
2. Add corresponding tests for security-sensitive code
3. Update navigation if adding new pages
4. Maintain security headers and middleware protection
5. Run tests after making changes: `npm run test`
6. Verify application launches: `npm run dev`

### CTF Challenge Development
When adding CTF challenges:
- Document any intentional vulnerabilities clearly
- Maintain the secure baseline for production pages
- Add test coverage for both secure and vulnerable endpoints
- Keep challenges isolated from core application logic

### Code Quality Standards
- Use TypeScript for type safety
- Follow the established component patterns
- Implement proper error boundaries
- Maintain responsive design with Tailwind CSS
- Ensure all new API routes have corresponding tests

## Important Files

### Configuration
- `next.config.mjs` - Next.js config with security headers
- `jest.config.ts` - Test configuration with TypeScript support
- `tailwind.config.ts` - Styling configuration
- `tsconfig.json` - TypeScript compiler settings

### Security
- `middleware.ts` - Global security middleware and request logging
- `app/api/hello/route.ts` - Example of secure API patterns
- `__tests__/api.test.ts` - Security-focused test examples

### Documentation
- `README.md` - Comprehensive project documentation
- `cursor.md` - Development principles and practices

## CTF Challenge Context

This platform is specifically designed for a robotics-themed CTF competition. The baseline provides:
- Secure foundation demonstrating best practices
- Educational examples of common vulnerabilities
- Test-driven security validation
- Professional-grade development environment

Always verify that tests pass and the application launches correctly after making changes, especially when working with security-sensitive code or adding new CTF challenges.

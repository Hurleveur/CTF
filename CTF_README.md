# RoboTech Industries CTF - Challenge Documentation

This document contains all CTF challenges integrated into the RoboTech Industries website. It serves as a comprehensive reference for administrators to understand where challenges are located and how they can be solved.

## Quick Setup

1. **Set up Supabase Database**: Execute `supabase/schema.sql` in the Supabase SQL Editor to create all database tables with RLS policies and add the challenge data.

2. **Verify Challenge Endpoints**: All special routes are functional:
   - `/robots.txt` - Contains hints and disallowed paths
   - `/sitemap.xml` - Hidden base64-encoded challenge
   - `/security.txt` - ROT13 encoded flag in PGP block
   - `/intranet/kilroy` - Hidden internal page
   - `/admin-terminal?access=alex_was_here` - XSS-vulnerable admin terminal

3. **Enable Frontend Features**: Verify these work correctly:
   - **Konami Code**: ↑↑↓↓←→←→BA to reveal debug modal
   - **Source Code Fragments**: Hidden in HTML comments and sr-only divs
   - **Interactive Elements**: Assembly line page with progress-based challenge unlocking

## Complete Challenge List

### Database Challenge Schema

All challenges follow this structure in the Supabase database:

```sql
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('web', 'crypto', 'forensics', 'pwn', 'reverse', 'misc')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  flag TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  file_url TEXT,
  hints TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Challenge Access Flow

1. **Authentication Required**: All challenges require authentication to access (via RLS policies)
2. **Challenge Discovery**: 
   - Some challenges appear in the UI directly via `/api/challenges` endpoint
   - Hidden challenges are discoverable through reconnaissance
3. **Submission**: Submit flags via `POST /api/challenges/submit` endpoint
4. **Progress Tracking**: Submission results update user project's neural reconstruction percentage

### 🟢 EASY CHALLENGES (50-150 points)

#### 1. Welcome to CTF (50 points)
- **Flag**: `RBT{welcome_to_robotics_ctf}`
- **Category**: misc
- **Difficulty**: easy
- **Interface**: Assembly Line page (automatically provided)
- **API Access**: `GET /api/challenges` (requires auth)

#### 2. Basic Web Security (100 points)
- **Flag**: `RBT{admin_panel_found}`
- **Category**: web
- **Difficulty**: easy
- **Interface**: Assembly Line page (automatically provided)
- **API Access**: `GET /api/challenges` (requires auth)

#### 3. Site Architecture (100 points)
- **Flag**: `RBT{site_maps_show_hidden_paths}`
- **Location**: `/sitemap.xml`
- **Category**: web
- **Difficulty**: easy
- **Description**: Navigate the blueprint of RoboTech's web presence
- **Discovery**: Hidden route listed in robots.txt
- **Solution**: 
  1. Visit `/sitemap.xml`
  2. Collect base64 values from all `<priority>` tags
  3. Concatenate and base64 decode to get flag

#### 4. Code Archaeology (125 points)
- **Flag**: `RBT{fragment_collector_2024}`
- **Location**: Source code of multiple pages (Home, About, Solutions)
- **Category**: forensics
- **Difficulty**: easy
- **Description**: Dig through source and piece together fragments
- **Solution**:
  1. Collect hex fragments from various page sources
  2. Concatenate and convert to ASCII

#### 5. Hidden Steganography (150 points)
- **Flag**: `RBT{not_ai_generated_sunset}`
- **Location**: Images on the site
- **Category**: forensics/steganography
- **Difficulty**: easy
- **Description**: Not all images are what they appear to be
- **Solution**: Use steganography tools to extract hidden data

### 🟡 MEDIUM CHALLENGES (200-325 points)

#### 6. Robot Assembly Code (200 points)
- **Flag**: `RBT{assembly_master_2024}`
- **Category**: reverse
- **Difficulty**: medium
- **Interface**: Assembly Line page (automatically provided)
- **API Access**: `GET /api/challenges` (requires auth)

#### 7. Intern Account Access (200 points)
- **Flag**: `RBT{sleepy_intern_logged_in}`
- **Location**: Login page
- **Category**: misc
- **Difficulty**: medium
- **Description**: The company intern Alex has a weak password
- **Hints**: 
  - Email: alex@robo.tech
  - Password: TODOp@ssw0rd (follows sleep-deprived developer pattern)
- **Solution**: Log in with the intern's credentials

#### 8. Internal Documentation (225 points)
- **Flag**: `RBT{intranet_kilroy_was_here}`
- **Location**: `/intranet/kilroy`
- **Category**: web
- **Difficulty**: medium
- **Description**: Employee portal wasn't properly secured
- **Discovery**: Hidden route in robots.txt disallowed paths
- **Solution**: Visit the path directly to find the flag

#### 9. Contact Protocol (250 points)
- **Flag**: `RBT{security_through_obscurity_fails}`
- **Location**: `/security.txt`
- **Category**: crypto
- **Difficulty**: medium
- **Description**: Security best practices with vulnerabilities
- **Discovery**: Security.txt is a standard location for security contact info
- **Solution**:
  1. Visit `/security.txt`
  2. Find ROT13 encoded text in fake PGP block
  3. Decode ROT13 to get the flag

#### 10. Admin Terminal Breach (250 points)
- **Flag**: `RBT{admin_terminal_pwned}`
- **Location**: `/admin-terminal?access=alex_was_here`
- **Category**: web
- **Difficulty**: medium
- **Description**: The intern left a backdoor to the admin terminal
- **Discovery**: Hint in security.txt about admin access
- **Solution**:
  1. Find access parameter: `?access=alex_was_here`
  2. Access terminal and use XSS payload to reveal flag

#### 11. Developer Backdoor (275 points)
- **Flag**: `RBT{konami_debug_mode_active}`
- **Location**: Navigation component (Konami code activation)
- **Category**: reverse
- **Difficulty**: medium
- **Description**: Alex left debug access via legendary gamer sequence
- **Solution**:
  1. Enter Konami code: ↑↑↓↓←→←→BA on keyboard
  2. Debug button appears in navigation
  3. Click debug button to open modal with obfuscated JavaScript
  4. Decode ASCII values to get flag

### 🔴 HARD CHALLENGES (300-500 points)

#### 12. Encrypted Communications (300 points)
- **Flag**: `RBT{robots_speak_in_riddles}`
- **Category**: crypto
- **Difficulty**: hard
- **Interface**: Assembly Line page (advanced section)
- **API Access**: `GET /api/challenges` (requires auth)
- **Note**: Becomes visible when neural reconstruction reaches ≥50%

#### 13. Alexandre's Account (400 points)
- **Flag**: `RBT{intern_account_compromised}`
- **Category**: misc
- **Difficulty**: hard
- **Description**: Guess the password of Alexandre De Groodt, the sleep-deprived intern
- **Hints**: Personal info scattered on about/team pages
- **Solution**: Use information gathering and password cracking techniques

#### 14. GraphQL Exposure (450 points)
- **Flag**: `RBT{graphql_endpoint_exposed}`
- **Location**: `/api/admin/graphql`
- **Category**: web
- **Difficulty**: hard
- **Description**: Hidden GraphQL endpoint with improper access controls
- **Discovery**: Mentioned in admin terminal comments
- **Solution**: Send GraphQL queries to extract sensitive data

#### 15. Neural Network Telemetry (500 points)
- **Flag**: `RBT{telemetry_decoded_alex_key}`
- **Location**: WebSocket connection on assembly line
- **Category**: forensics
- **Difficulty**: hard 
- **Description**: Intercept and decode robotic arm communications
- **Note**: This is a placeholder for future implementation

### Authentication Reference

#### Regular User
- Can be created through signup process
- Has access to basic challenges

#### Intern Account
- Email: alex@robo.tech
- Password: TODOp@ssw0rd
- Special access to admin terminal with correct URL parameter

## Authentication & API Integration

### Challenge Access Control

All challenge data is protected by Row Level Security (RLS) policies:

```sql
-- RLS Policies for challenges table
CREATE POLICY "Active challenges are viewable by authenticated users" ON public.challenges
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage all challenges" ON public.challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Challenge API Endpoints

#### Get All Challenges
**Endpoint**: `GET /api/challenges`
**Authentication**: Required
**Returns**: Array of challenge objects without flags

```typescript
// Example response
{
  "challenges": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Welcome to CTF",
      "description": "This is your first challenge!",
      "category": "misc",
      "difficulty": "easy",
      "points": 50,
      "hints": null
    },
    // more challenges...
  ],
  "count": 15
}
```

#### Submit Flag
**Endpoint**: `POST /api/challenges/submit`
**Authentication**: Required
**Request Body**:
```json
{
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000", // Optional, will try to match by flag
  "flag": "CTF{welcome_to_robotics_ctf}"
}
```

**Response (Success)**:
```json
{
  "correct": true,
  "message": "Consciousness fragment accepted! Neural pathway restored.",
  "challenge_id": "550e8400-e29b-41d4-a716-446655440000",
  "challenge_title": "Welcome to CTF",
  "points_awarded": 50,
  "progress_increment": 5,
  "total_progress": 15
}
```

**Response (Failure)**:
```json
{
  "correct": false,
  "message": "Invalid consciousness fragment.",
  "points_awarded": 0
}
```

### Enhanced User Experience Features

- **Konami Code Detection**: Enter ↑↑↓↓←→←→BA to reveal debug modal
- **Neural Threshold Trigger**: Advanced challenges unlock at 50% progress
- **Interactive Terminal**: Admin terminal with command parsing
- **Progress-Based Unlocks**: Neural reconstruction percentage reveals new content

## Challenge Categories Distribution

| Category | Count | Examples |
|----------|-------|----------|
| **Web** | 5 | Site Architecture, Admin Terminal, GraphQL Exposure, Internal Documentation |
| **Crypto** | 2 | Contact Protocol, Encrypted Communications |
| **Forensics** | 3 | Code Archaeology, Neural Network Telemetry, Hidden Steganography |
| **Reverse** | 2 | Robot Assembly Code, Developer Backdoor |
| **Misc** | 3 | Welcome to CTF, Intern Account Access, Alexandre's Account |

## Challenge Discovery Methods

| Method | Example Challenges | Required Skills |
|--------|-------------------|------------------|
| **API Endpoint** | Welcome to CTF, Robot Assembly Code | Authentication, API usage |
| **Source Inspection** | Code Archaeology | HTML analysis, hex conversion |
| **Hidden Routes** | Site Architecture, Internal Documentation | Directory enumeration, robots.txt analysis |
| **Cryptography** | Contact Protocol | ROT13, base64 decoding |
| **Auth Bypass** | Admin Terminal, Intern Account | Parameter manipulation, credential testing |
| **Advanced Interactions** | Developer Backdoor | Konami code, JavaScript analysis |

## Difficulty Distribution

| Difficulty | Point Range | Count | Required Skills |
|------------|-------------|-------|------------------|
| **Easy** | 50-150 | 5 | Basic web skills, simple encoding/decoding |
| **Medium** | 200-275 | 6 | Cryptography, authentication bypass, JavaScript analysis |
| **Hard** | 300-500 | 4 | XSS exploitation, advanced cryptography, credential cracking |

## Implementation Details

### Flag Formats

Two flag formats are used:
- Standard: `CTF{descriptive_flag_content}` - Used for visible challenges in the UI
- Hidden: `RBT{descriptive_flag_content}` - Used for challenges found through reconnaissance

### Challenge Files Structure

```
app/
├── api/                  # API routes with challenge endpoints
├── admin-terminal/      # Admin terminal challenge
├── intranet/            # Internal documentation challenge
│   └── kilroy/          # Kilroy was here page
├── robots.txt/          # Custom robots.txt route
├── security.txt/        # Security.txt challenge
├── sitemap.xml/         # Sitemap challenge with base64 encoding
├── assembly-line/       # Main challenge interface
│   └── AssemblyLineContent.tsx  # Contains neural threshold logic
```

### Security Vulnerabilities (Intentional)

⚠️ **Warning**: The following vulnerabilities are INTENTIONAL for educational purposes:

- **XSS Vulnerability**: Admin terminal allows script injection
- **Weak Authentication**: URL parameter-based access control
- **Insecure API**: Unauthenticated GraphQL endpoint
- **Information Disclosure**: Leaked credentials in comments
- **Insecure Direct Object References**: Predictable file paths

These vulnerabilities should NEVER be implemented in production systems and exist purely for CTF educational purposes.

### Testing & Validation

All challenge endpoints:
- Return proper HTTP status codes
- Are accessible through intended discovery methods
- Have working solutions with clear learning objectives
- Follow a logical progression of difficulty

The platform guides users from basic reconnaissance to advanced exploitation techniques.

## Adding New Challenges

### 1. Add to Database

```sql
INSERT INTO public.challenges (
  title, 
  description, 
  category, 
  difficulty, 
  flag, 
  points, 
  hints
) VALUES (
  'Your Challenge Title', 
  'Description of the challenge', 
  'web', -- Choose from: web, crypto, forensics, pwn, reverse, misc
  'medium', -- Choose from: easy, medium, hard
  'RBT{your_custom_flag_here}', 
  250, -- Point value
  ARRAY['Hint 1', 'Hint 2'] -- Optional hints
);
```

### 2. Implement Discovery Method

Depending on the challenge type:

- **Web Challenge**: Add route handler in `app/your-route/route.ts`
- **Source Code Challenge**: Add fragments to appropriate component
- **API Challenge**: Implement new endpoint in `app/api/your-endpoint/route.ts`
- **Auth Challenge**: Add special access in `middleware.ts` or related authentication logic

### 3. Test Solution Path

Verify the complete solve path works:

1. Challenge is discoverable through intended method
2. Flag submission works via API
3. Points are awarded and progress updates

---

**Total Challenges**: 15 challenges across 5 categories  
**Point Range**: 50-500 points  
**Estimated Solve Time**: 4-10 hours for experienced CTF participants

This comprehensive CTF platform integrates seamlessly with the RoboTech Industries corporate website facade while providing progressive difficulty challenges that teach modern web security, cryptography, and reverse engineering skills.

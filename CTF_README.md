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

### 🟢 EASY CHALLENGES (50-75 points)

#### 1. Registration Reward (50 points)
- **Flag**: `RBT{w3lc0m3_t0_n3ur4l_r3st0r4t10n_2025}`
- **Category**: misc
- **Difficulty**: easy
- **Location**: Signup/Registration process
- **Description**: Congratulations on completing your neural account registration!
- **Step-by-Step Solution**:
  1. Navigate to `/signup` page
  2. Create a new account with email and password
  3. Complete the registration process
  4. Look for welcome messages or confirmation screens
  5. The flag is automatically rewarded upon successful registration

#### 2. Patrick's Security Protocol (50 points)
- **Flag**: `RBT{p4tr1ck_st4r_s3cur1ty_3xp3rt_9d2f1a8c}`
- **Category**: misc
- **Difficulty**: easy
- **Location**: `/team` page - Patrick Star's profile
- **Description**: Patrick Star AGI is hiding something...
- **Step-by-Step Solution**:
  1. Navigate to `/team` page
  2. Look for Patrick Star in the team directory
  3. Click on Patrick's avatar or profile section
  4. Look for a hidden modal, easter egg, or popup that appears
  5. The flag will be revealed in Patrick's hidden information

#### 3. Site Architecture (50 points)
- **Flag**: `RBT{site_maps_show_hidden_paths}`
- **Category**: web
- **Difficulty**: easy
- **Location**: `/sitemap.xml`
- **Description**: Navigate the blueprint of RoboTech's web presence. Sometimes the map reveals more than intended.
- **Step-by-Step Solution**:
  1. Visit `/sitemap.xml` in your browser
  2. Examine the XML structure looking for encoded values
  3. Find base64 encoded values in `<priority>` tags throughout the sitemap
  4. Collect all the base64 values: `UkJUe3NpdGVfbWFwc19zaG93X2hpZGRlbl9wYXRoc30=`
  5. Decode the base64 string to get the flag

#### 4. Hidden in Plain Text (75 points)
- **Flag**: `RBT{smile}`
- **Category**: forensics
- **Difficulty**: easy
- **Location**: `/about` page - developer story section
- **Description**: Some text on the about page looks... different. Unicode can hide secrets in ways you might not expect.
- **Step-by-Step Solution**:
  1. Navigate to `/about` page
  2. Look carefully at the developer story section for unusual-looking text
  3. Copy the weird text that appears normal but might use different Unicode characters
  4. Go to https://holloway.nz/steg/ or a similar Unicode steganography decoder
  5. Paste the text and decode to reveal the hidden flag

#### 5. Code Archaeology (75 points)
- **Flag**: `RBT{fragment_collector_2024}`
- **Category**: forensics
- **Difficulty**: medium
- **Location**: Source code across multiple pages
- **Description**: The intern left traces of his work throughout the site. Dig through the source and piece together the fragments.
- **Step-by-Step Solution**:
  1. Right-click and "View Source" on the home page
  2. Look for HTML comments containing hex fragments
  3. Visit `/about` and `/solutions` pages and view their source code
  4. Collect all hex fragments from HTML comments across pages
  5. Concatenate all fragments: `5242547B667261676D656E745F636F6C6C6563746F725F323032347D`
  6. Convert the hex string to ASCII to get the flag

### 🟡 MEDIUM CHALLENGES (100-250 points)

#### 6. In the Shadows (100 points)
- **Flag**: `RBT{sh4d0w_0p5_1nv151bl3_h4ck3r_7x9y2z8a}`
- **Category**: web
- **Difficulty**: medium
- **Location**: `/team` page - Shadow Ops intern profile
- **Description**: Names can hold great power.
- **Step-by-Step Solution**:
  1. Navigate to `/team` page
  2. Find the Shadow Ops intern's name in the team listing
  3. Right-click and "Inspect Element" on their name
  4. Look at the DOM/HTML structure around the name
  5. The flag is hidden in invisible HTML attributes or hidden elements
  6. Check for `style="display:none"` or similar hidden content

#### 7. Gamer Backdoor (100 points)
- **Flag**: `RBT{konami_debug_mode_active}`
- **Category**: reverse
- **Difficulty**: medium
- **Location**: Any page with navigation
- **Description**: Alex left himself a way to access debug functions. The sequence is legendary among gamers.
- **Step-by-Step Solution**:
  1. On any page, use your keyboard to enter the Konami code sequence
  2. Press: ↑ ↑ ↓ ↓ ← → ← → B A (use arrow keys, then B and A keys)
  3. A debug button will appear in the navigation bar
  4. Click the debug button to open a debug modal
  5. The modal contains obfuscated JavaScript with ASCII codes
  6. Decode `String.fromCharCode(82,66,84,123,107,111,110,97,109,105,95,100,101,98,117,103,95,109,111,100,101,95,97,99,116,105,118,101,125)` to get the flag

#### 8. Internal Documentation (125 points)
- **Flag**: `RBT{intranet_kilroy_was_here}`
- **Category**: web
- **Difficulty**: medium
- **Location**: `/intranet/kilroy`
- **Description**: RoboTech's internal employee portal wasn't properly secured and blocked.
- **Step-by-Step Solution**:
  1. First, visit `/robots.txt` to see what crawlers are told to avoid
  2. Look for disallowed paths mentioning "intranet"
  3. Navigate directly to `/intranet/kilroy`
  4. The flag is displayed on the internal employee portal page
  5. "Kilroy was here" is a reference to corporate culture/employee names

#### 9. Contact Protocol (125 points)
- **Flag**: `RBT{security_through_obscurity_fails}`
- **Category**: crypto
- **Difficulty**: medium
- **Location**: `/security.txt`
- **Description**: RoboTech follows security best practices for vulnerability disclosure. But their implementation has... vulnerabilities.
- **Step-by-Step Solution**:
  1. Navigate to `/security.txt` (RFC 9116 standard security contact file)
  2. Look for a PGP block that seems suspicious
  3. Copy the text from the fake PGP block
  4. Apply ROT13 decoding to the text
  5. The decoded text reveals the flag

#### 10. GraphQL Endpoint Exposure (150 points)
- **Flag**: `RBT{graphql_endpoint_exposed}`
- **Category**: web
- **Difficulty**: medium
- **Location**: `/api/admin/graphql`
- **Description**: An unauthenticated GraphQL API endpoint is leaking admin secrets.
- **Step-by-Step Solution**:
  1. Navigate to `/api/admin/graphql` in your browser (GET request)
  2. Try a POST request with GraphQL query: `{ secrets { id title value } }`
  3. Use curl or a tool like Postman:
     ```bash
     curl -X POST /api/admin/graphql \
       -H "Content-Type: application/json" \
       -d '{"query": "{ secrets { id title value } }"}'    
     ```
  4. The GraphQL response will contain sensitive data including the flag
  5. This endpoint should never be accessible without authentication

#### 11. Digital Memories (200 points)
- **Flag**: `RTB{not_ai_generated_sunset}`
- **Category**: forensics
- **Difficulty**: medium
- **Location**: Image files on the site (intern's photo)
- **Description**: The intern's photo contains more than just his tired face. Images can hide secrets in their very pixels.
- **Step-by-Step Solution**:
  1. Find the intern's photo on the site (likely in `/about` or `/team`)
  2. Save the image file to your computer
  3. Check EXIF metadata: `exiftool image.jpg`
  4. Use steganography tools to check for hidden files:
     - `steghide extract -sf image.jpg`
     - `binwalk image.jpg`
     - `strings image.jpg | grep RBT`
  5. Look for LSB (Least Significant Bit) steganography
  6. If JSON is found, it might be corrupted and need repair
  7. Extract the hidden flag from the image data

#### 12. Frontend Admin Bypass (250 points)
- **Flag**: `RBT{frontend_admin_checks_are_useless}`
- **Category**: web
- **Difficulty**: medium
- **Location**: Any page with admin functionality
- **Description**: Some vibe coders make the mistake of relying only on frontend checks.
- **Step-by-Step Solution**:
  1. Open browser Developer Tools (F12)
  2. Look for JavaScript that controls admin access
  3. Find client-side validation code that checks for admin permissions
  4. Bypass the frontend check by:
     - Modifying JavaScript variables in the console
     - Changing localStorage or sessionStorage values
     - Editing DOM elements that control admin access
  5. Once admin access is enabled in the frontend, the flag is revealed
  6. This demonstrates why server-side validation is crucial

### 🔴 HARD CHALLENGES (250-300 points)

#### 13. Administrator Terminal (250 points)
- **Flag**: `RBT{admin_terminal_pwned}`
- **Category**: web
- **Difficulty**: hard
- **Location**: `/admin-terminal` (with special access parameter)
- **Description**: Alex built an admin interface for debugging the AI systems. Security was... an afterthought.
- **Step-by-Step Solution**:
  1. Try to access `/admin-terminal` directly (you'll get access denied)
  2. Look for hints in `/security.txt` or other locations about admin access
  3. Discover the URL parameter needed: `?access=alex_was_here`
  4. Navigate to `/admin-terminal?access=alex_was_here`
  5. You'll see a terminal interface with various commands available
  6. Try the `flag` command - it will be denied due to insufficient privileges
  7. Explore other commands like `logs`, `neural`, etc. to understand the system
  8. Notice that the terminal processes HTML/JavaScript input unsanitized
  9. Construct an XSS payload that attempts to access the administrative flag variable: `<script>window.adminFlag</script>`
  10. The system will execute the XSS payload and reveal the flag when it detects access to the admin flag variable
  11. **Bonus**: The GraphQL endpoint `/api/admin/graphql` is also exposed from here

#### 14. Intern Account Access (300 points)
- **Flag**: `RBT{sleepy_intern_logged_in}`
- **Category**: misc
- **Difficulty**: hard
- **Location**: `/login` page
- **Description**: The intern probably has hidden some flag in his account. Try to guess his email and password. He had to suffer the same harsh password policies as you!
- **Step-by-Step Solution**:
  1. Gather information about the intern from `/about` and `/team` pages
  2. Note hints about the intern being sleep-deprived and working late hours
  3. Try common email patterns for the intern: `alex@robo.tech`
  4. For the password, consider sleep-deprived developer patterns
  5. Log in with `alex@robo.tech` and `P@ssw0rd`
  6. Once logged in, the flag will be revealed in /team

### Authentication Reference

#### Regular User
- Can be created through signup process
- Has access to basic challenges

#### Intern Account
- Email: alex@robo.tech
- Password: P@ssw0rd
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
| **Web** | 6 | Site Architecture, In the Shadows, Internal Documentation, GraphQL Exposure, Frontend Admin Bypass, Administrator Terminal |
| **Crypto** | 1 | Contact Protocol |
| **Forensics** | 4 | Code Archaeology, Hidden in Plain Text, Digital Memories |
| **Reverse** | 1 | Gamer Backdoor |
| **Misc** | 3 | Registration Reward, Patrick's Security Protocol, Intern Account Access |

## Challenge Discovery Methods

| Method | Example Challenges | Required Skills |
|--------|-------------------|------------------|
| **Registration Process** | Registration Reward | Account creation |
| **Team Page Interaction** | Patrick's Security Protocol, In the Shadows | DOM inspection, clicking interactions |
| **Source Inspection** | Code Archaeology, Hidden in Plain Text | HTML analysis, hex conversion, Unicode steganography |
| **Hidden Routes** | Site Architecture, Internal Documentation | robots.txt analysis, direct path access |
| **Cryptography** | Contact Protocol | ROT13, base64 decoding |
| **Special Sequences** | Gamer Backdoor | Konami code, JavaScript reverse engineering |
| **API Exploitation** | GraphQL Exposure | GraphQL queries, API testing |
| **Image Analysis** | Digital Memories | Steganography, EXIF analysis, LSB extraction |
| **Frontend Bypass** | Frontend Admin Bypass | Browser dev tools, JavaScript manipulation |
| **Auth Testing** | Administrator Terminal, Intern Account | Parameter manipulation, credential guessing |

## Difficulty Distribution

| Difficulty | Point Range | Count | Required Skills |
|------------|-------------|-------|------------------|
| **Easy** | 50-75 | 5 | Registration, basic interaction, simple decoding, Unicode steganography |
| **Medium** | 100-250 | 7 | DOM inspection, Konami codes, ROT13, steganography, GraphQL, frontend bypass |
| **Hard** | 250-300 | 2 | XSS exploitation, credential guessing, parameter manipulation |

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

**Total Challenges**: 14 challenges across 5 categories  
**Point Range**: 50-300 points  
**Estimated Solve Time**: 3-8 hours for experienced CTF participants  
**Total Possible Points**: 1,900 points

### Challenge Summary by Points:
- **50 points (3 challenges)**: Registration Reward, Patrick's Security Protocol, Site Architecture
- **75 points (2 challenges)**: Hidden in Plain Text, Code Archaeology  
- **100 points (2 challenges)**: In the Shadows, Gamer Backdoor
- **125 points (2 challenges)**: Internal Documentation, Contact Protocol
- **150 points (1 challenge)**: GraphQL Endpoint Exposure
- **200 points (1 challenge)**: Digital Memories
- **250 points (2 challenges)**: Frontend Admin Bypass, Administrator Terminal
- **300 points (1 challenge)**: Intern Account Access

This comprehensive CTF platform integrates seamlessly with the RoboTech Industries corporate website facade while providing progressive difficulty challenges that teach modern web security, steganography, cryptography, and authentication bypass techniques.

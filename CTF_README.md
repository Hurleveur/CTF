# RoboTech Industries CTF - Hidden Challenges Documentation

This document contains all hidden CTF challenges added to the website for administrators.

## Quick Setup

1. **Run the SQL seed script**: Execute `supabase/seed_hidden_challenges.sql` in the Supabase SQL Editor to add all challenges to the database.

2. **Challenge endpoints are active**: All hidden routes (`/robots.txt`, `/sitemap.xml`, `/security.txt`, `/intranet/kilroy`, `/admin-terminal`) are now functional.

3. **Frontend features**: Konami code detection, source code fragments, and debug modal are integrated.

## Complete Challenge List

### 🟢 EASY CHALLENGES (50-150 points)

#### 3. Site Architecture (100 points)
- **Flag**: `RBT{site_maps_show_hidden_paths}`
- **Location**: `/sitemap.xml`
- **Category**: web
- **Description**: Navigate the blueprint of RoboTech's web presence
- **Solution**: 
  1. Visit `/sitemap.xml`
  2. Collect base64 values from all `<priority>` tags
  3. Concatenate: `UkJUe3NpdGVfbWFwc19zaG93X2hpZGRlbl9wYXRoc30=`
  4. Base64 decode to get flag

#### 4. Code Archaeology (125 points) V
- **Flag**: `RBT{fragment_collector_2024}`
- **Location**: Source code of multiple pages (Home, About)
- **Category**: forensics
- **Description**: Dig through source and piece together fragments
- **Solution**:
  1. View source of home page: `52426545` (Fragment 1/4)
  2. Find in sr-only div: `667261676D656E74` (Fragment 2/4)  
  3. Find in home page footer: `5F636F6C` (Fragment 3/4)
  4. Find in solution page: `6C6563746F725F32303234` (Fragment 4/4)
  5. Concatenate all: `52426545667261676D656E745F636F6C6C6563746F725F32303234`
  6. Convert hex to ASCII: `RBT{fragment_collector_2024}`

#### 5. Hidden in shadows
Can be found by selecting the name of Léandre, in the inner html.

### 🟡 MEDIUM CHALLENGES (200-325 points)

#### 6. Internal Documentation (225 points)
- **Flag**: `RBT{intranet_kilroy_was_here}`
- **Location**: `/intranet/kilroy`
- **Category**: web
- **Description**: Employee portal wasn't properly secured
- **Solution**: 
  1. Find hint in `robots.txt` (disallowed path)
  2. Visit `/intranet/kilroy` directly
  3. Flag is displayed on the page

#### 7. Contact Protocol (250 points)
- **Flag**: `RBT{security_through_obscurity_fails}`
- **Location**: `/security.txt`
- **Category**: crypto
- **Description**: Security best practices with vulnerabilities
- **Solution**:
  1. Visit `/security.txt`
  2. Find ROT13 encoded text in fake PGP block
  3. Decode ROT13: `SECURITY_THROUGH_OBSCURITY_FAILS_ROT13_DECODE_ME` becomes the hint
  4. Find the actual flag in the ROT13 text: `EOS{frpgevgl_guebhtu_bofphevgl_snvyf}`
  5. Decode to get: `RBT{security_through_obscurity_fails}`

#### 8. Developer Backdoor (275 points) V
- **Flag**: `RBT{konami_debug_mode_active}`
- **Location**: Navigation component (Konami code activation)
- **Category**: reverse
- **Description**: Alex left debug access via legendary gamer sequence
- **Solution**:
  1. Enter Konami code: ↑↑↓↓←→←→BA on keyboard
  2. Debug button appears in navigation
  3. Click debug button to open modal
  4. Reverse engineer the obfuscated JavaScript:
  5. Extract ASCII values from `String.fromCharCode(82,66,84,123,107,111,110,97,109,105,95,100,101,98,117,103,95,109,111,100,101,95,97,99,116,105,118,101,125)`
  6. Convert to characters: `RBT{konami_debug_mode_active}`

#### 9. TODO? Neural Network Telemetry (325 points)
- **Flag**: `RBT{telemetry_decoded_alex_key}`
- **Location**: WebSocket connection (placeholder for future implementation)
- **Category**: forensics  
- **Description**: Intercept and decode robotic arm communications
- **Solution**: (Would require WebSocket implementation with XOR encryption)

### 🔴 HARD CHALLENGES (400-500 points)

#### 10. Administrator Terminal (450 points)
- **Flag**: `RBT{admin_terminal_pwned}`
- **Location**: `/admin-terminal?access=alex_was_here`
- **Category**: web
- **Description**: Admin interface with security vulnerabilities
- **Solution**:
  1. Find hint in `/security.txt` or discover via sitemap
  2. Try to access `/admin-terminal` (denied)
  3. Find access parameter hint: `?access=alex_was_here`
  4. Access `/admin-terminal?access=alex_was_here`
  5. Use terminal commands to explore
  6. Input XSS payload: `<script>alert("test")</script>`
  7. System detects XSS and reveals flag: `RBT{admin_terminal_pwned}`
  8. **Bonus**: Access GraphQL endpoint at `/api/admin/graphql` for additional flag: `RBT{graphql_endpoint_exposed}`

### Log in as alex
mail: alex@robot.tech
pswd: TODOp@ssw0rd

## Additional Features Implemented

### Security Test Endpoints
- `/api/admin/graphql` - Exposed GraphQL endpoint with mock data
- Contains additional secrets and demonstrates poor API security

### Enhanced User Experience  
- Konami code detection with visual feedback
- Debug modal with obfuscated code challenge
- Progressive hints in about page
- Corporate-themed design maintains immersion

### Source Code Easter Eggs
- ROT13 hints in HTML comments
- Hidden sr-only divs with hex fragments
- Glitched text hints for steganography challenges

## Challenge Categories Distribution
- **Web**: 6 challenges (robots.txt, sitemap, intranet, admin terminal, graphql)
- **Crypto**: 3 challenges (security.txt, CSS cipher, various encoding)
- **Forensics**: 3 challenges (code archaeology, telemetry, steganography) 
- **Reverse**: 1 challenge (Konami debug code)
- **Misc**: 2 challenges (welcome, meta-challenge)

## Difficulty Progression
- **Easy (50-150pts)**: Source code inspection, basic web enumeration
- **Medium (200-325pts)**: Encoding/decoding, path discovery, code analysis
- **Hard (400-500pts)**: XSS exploitation, advanced reverse engineering, meta-challenges

## Implementation Status
✅ **Completed**:
- Database schema and seed data
- Secret text endpoints (robots.txt, sitemap.xml, security.txt)  
- Hidden pages (/intranet/kilroy, /admin-terminal)
- GraphQL endpoint with mock data
- Source code fragments and comments
- Konami code detection and debug modal
- Progressive hints and corporate theming

⏳ **Placeholders** (for future implementation):
- CSS class cipher challenge
- Steganographic image with embedded data
- WebSocket telemetry challenge  
- Meta-challenge fragment collection system

## Flag Format
All flags follow the format: `RBT{descriptive_flag_content}`

## Security Notes
⚠️ **Warning**: The admin terminal and GraphQL endpoints contain intentional vulnerabilities for educational purposes only. In a real application, these would be extremely dangerous:

- XSS vulnerability in terminal input
- Unauthenticated GraphQL endpoint
- Exposed admin functionality
- Weak access control via URL parameters

These are educational security anti-patterns and should never be implemented in production systems.

## Testing
All endpoints return proper HTTP status codes and are accessible without being in navigation menus. The challenge flow guides users from easy reconnaissance to advanced exploitation techniques.

---

**Total Challenges**: 11 implemented + 4 placeholders = 15 planned challenges  
**Point Range**: 50-500 points  
**Estimated Solve Time**: 2-8 hours for experienced CTF participants

This comprehensive CTF provides a realistic corporate website facade with progressive difficulty challenges that teach modern web security, cryptography, and reverse engineering skills.

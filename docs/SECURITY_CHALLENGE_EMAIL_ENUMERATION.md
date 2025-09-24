# Email Enumeration Security Challenge

## Overview

This security challenge demonstrates a common web application vulnerability: **Information Disclosure through Email Enumeration**. The challenge is designed to teach developers and security professionals about:

- How email enumeration attacks work
- The privacy and security risks of exposing user email addresses
- Detection and mitigation strategies
- Responsible vulnerability disclosure

## Vulnerability Description

### The Issue
Several API endpoints in the application expose user email addresses to any authenticated user:

1. **`/api/team`** - Returns all team members with their email addresses
2. **`/api/projects/all`** - Exposes team member emails in project details  
3. **`/api/leaderboard`** - Conditionally exposes email addresses

### Attack Vector
An attacker with a valid account could:
1. Make repeated requests to these endpoints
2. Harvest email addresses of all users
3. Use this information for:
   - Spear phishing attacks
   - Social engineering
   - Spam campaigns
   - Cross-platform account enumeration

### Real-World Impact
- **Privacy Violation**: Users' email addresses exposed without consent
- **Social Engineering**: Attackers can craft targeted phishing emails
- **Account Takeover**: Email addresses can be used for password reset attacks
- **Compliance Issues**: GDPR/privacy regulation violations

## How the Challenge Works

### Detection Mechanism
The application monitors for suspicious patterns:
- Multiple rapid requests to user data endpoints
- Accessing `/api/team`, `/api/projects/all`, `/api/leaderboard` frequently
- More than 3 requests to user endpoints in 10 minutes
- More than 8 total requests in 10 minutes

### Challenge Response
When suspicious activity is detected:
1. **Fake Data Injection**: Real email addresses are replaced with obvious fake ones
2. **Challenge Users**: Fake users with security-themed data are injected
3. **Educational Content**: Hints and learning materials are provided
4. **Flag Revelation**: A CTF flag is provided upon completion

### Fake Email Patterns
The challenge injects emails like:
- `security.challenge@robotech.fake`
- `enumeration.detected@ctf.fake`
- `you.found.me@challenge.fake`
- `nice.try@security.fake`

## Challenge Completion

### Discovery Endpoint
Access `/api/security/enumeration-challenge` to:
- Check your challenge status
- Get detailed vulnerability information
- Receive the CTF flag
- Learn about mitigation strategies

### Expected Flag
`CTF{email_enumeration_teaches_security_awareness}`

## Educational Objectives

### For Developers
1. **Understand Information Disclosure**: Learn how seemingly innocent API endpoints can leak sensitive data
2. **Implement Proper Access Controls**: Only return data that the requesting user should see
3. **Data Sanitization**: Remove or mask sensitive fields in API responses
4. **Audit Logging**: Monitor access to sensitive endpoints

### For Security Professionals
1. **Vulnerability Assessment**: Learn to identify information disclosure issues
2. **Risk Assessment**: Understand the business impact of email enumeration
3. **Detection Strategies**: Implement monitoring for suspicious access patterns
4. **Mitigation Planning**: Develop comprehensive fixes for information disclosure

## Mitigation Strategies

### Immediate Fixes
1. **Remove Email Fields**: Don't include email addresses in public API responses
2. **Access Control**: Implement field-level permissions
3. **Data Transformation**: Use display names or handles instead of emails
4. **Rate Limiting**: Prevent automated harvesting attempts

### Long-term Solutions
1. **Security Architecture Review**: Audit all API endpoints for sensitive data exposure
2. **Privacy by Design**: Consider privacy implications in new features
3. **Monitoring and Alerting**: Implement detection for unusual access patterns
4. **Security Training**: Educate developers about common vulnerabilities

### Code Examples

#### Vulnerable Code
```typescript
// BAD: Exposes all user emails
return {
  users: users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email  // ❌ Privacy risk!
  }))
}
```

#### Secure Code
```typescript
// GOOD: Only expose necessary data
return {
  users: users.map(user => ({
    id: user.id,
    name: user.name,
    // Only include email for current user
    email: user.id === currentUser.id ? user.email : undefined
  }))
}
```

## Testing the Challenge

### Manual Testing
1. Login to the application
2. Make multiple requests to:
   - `GET /api/team`
   - `GET /api/projects/all`
   - `GET /api/leaderboard`
3. Look for fake email addresses in responses
4. Access `/api/security/enumeration-challenge` for results

### Automated Testing
```bash
# Example curl commands to trigger the challenge
for i in {1..5}; do
  curl -H "Authorization: Bearer $TOKEN" \
       "https://app.example.com/api/team"
  sleep 1
done

# Check challenge status
curl -H "Authorization: Bearer $TOKEN" \
     "https://app.example.com/api/security/enumeration-challenge"
```

## Reporting Real Vulnerabilities

If you discover a real security vulnerability (not part of this challenge):

1. **Document the Issue**: Include steps to reproduce and potential impact
2. **Use the Reporting Endpoint**: POST to `/api/security/enumeration-challenge`
3. **Follow Responsible Disclosure**: Don't exploit the vulnerability
4. **Provide Context**: Explain the security implications

## Learning Resources

- [OWASP Information Exposure](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url)
- [CWE-200: Information Exposure](https://cwe.mitre.org/data/definitions/200.html)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)
- [GDPR Data Minimization Principle](https://gdpr-info.eu/art-5-gdpr/)

## Additional Challenges

After completing this challenge, look for:
- Other information disclosure vulnerabilities
- Access control bypasses
- Injection vulnerabilities
- Authentication weaknesses

Remember: The goal is to learn and improve application security, not to cause harm.
#!/usr/bin/env node

/**
 * Security Headers Test Script
 * 
 * This script tests the security headers implementation by making HTTP requests
 * to various routes and verifying that all required security headers are present.
 * 
 * Usage:
 *   node scripts/test-headers.js [base-url]
 *   
 * Examples:
 *   node scripts/test-headers.js http://localhost:3000
 *   node scripts/test-headers.js https://your-domain.com
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Required security headers that should be present on all responses
const REQUIRED_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'x-xss-protection',
  'referrer-policy',
  'permissions-policy'
];

// Test routes to verify header coverage
const TEST_ROUTES = [
  '/',
  '/about',
  '/projects',
  '/login',
  '/api/hello',
  '/api/statistics',
  '/assembly-line'
];

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

function checkHeaders(headers, route) {
  const results = {
    route,
    passed: [],
    failed: [],
    warnings: []
  };
  
  // Check required headers
  REQUIRED_HEADERS.forEach(header => {
    if (headers[header]) {
      results.passed.push(header);
    } else {
      results.failed.push(header);
    }
  });
  
  // Check specific header values
  if (headers['x-content-type-options'] !== 'nosniff') {
    results.warnings.push('X-Content-Type-Options should be "nosniff"');
  }
  
  if (headers['x-frame-options'] && 
      !['DENY', 'SAMEORIGIN'].includes(headers['x-frame-options'].toUpperCase())) {
    results.warnings.push('X-Frame-Options should be "DENY" or "SAMEORIGIN"');
  }
  
  // Check CSP basics
  const csp = headers['content-security-policy'];
  if (csp) {
    if (!csp.includes("default-src 'self'")) {
      results.warnings.push('CSP should include default-src self');
    }
    if (!csp.includes("object-src 'none'")) {
      results.warnings.push('CSP should include object-src none for security');
    }
  }
  
  return results;
}

function printResults(results) {
  console.log(`\n📍 Route: ${results.route}`);
  
  if (results.passed.length > 0) {
    console.log(`✅ Present: ${results.passed.join(', ')}`);
  }
  
  if (results.failed.length > 0) {
    console.log(`❌ Missing: ${results.failed.join(', ')}`);
  }
  
  if (results.warnings.length > 0) {
    console.log(`⚠️  Warnings:`);
    results.warnings.forEach(warning => console.log(`   - ${warning}`));
  }
}

async function testSecurityHeaders(baseUrl) {
  console.log(`🔍 Testing security headers for: ${baseUrl}`);
  console.log(`📋 Required headers: ${REQUIRED_HEADERS.join(', ')}`);
  
  let totalTests = 0;
  let passedTests = 0;
  let failedRoutes = [];
  
  for (const route of TEST_ROUTES) {
    const url = new URL(route, baseUrl).toString();
    
    try {
      const { statusCode, headers } = await makeRequest(url);
      
      if (statusCode >= 400) {
        console.log(`\n⚠️  Route ${route} returned status ${statusCode}`);
        continue;
      }
      
      const results = checkHeaders(headers, route);
      printResults(results);
      
      totalTests++;
      if (results.failed.length === 0) {
        passedTests++;
      } else {
        failedRoutes.push(route);
      }
      
    } catch (error) {
      console.log(`\n❌ Error testing ${route}: ${error.message}`);
    }
  }
  
  // Summary
  console.log(`\n📊 SUMMARY`);
  console.log(`Total routes tested: ${totalTests}`);
  console.log(`Routes with all headers: ${passedTests}`);
  console.log(`Routes with missing headers: ${totalTests - passedTests}`);
  
  if (failedRoutes.length > 0) {
    console.log(`❌ Routes missing headers: ${failedRoutes.join(', ')}`);
    console.log(`\n🔧 ACTION REQUIRED: Fix missing security headers`);
    process.exit(1);
  } else {
    console.log(`✅ All routes have required security headers!`);
    console.log(`\n🛡️  Security headers are properly configured`);
  }
}

// Main execution
const baseUrl = process.argv[2] || 'http://localhost:3000';

console.log('🔒 Security Headers Test');
console.log('========================');

testSecurityHeaders(baseUrl).catch(error => {
  console.error(`❌ Test failed: ${error.message}`);
  process.exit(1);
});
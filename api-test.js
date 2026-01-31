// Automated API Test Script for Ross Tax Prep Platform
// Run with: node api-test.js (requires node-fetch)


import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8787'; // Set to your local or deployed API URL


async function testEndpoint(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    console.log(`\n[${res.status}] ${path}`);
    console.log(body);
    return { status: res.status, body };
  } catch (e) {
    console.error(`Error testing ${path}:`, e);
    return { status: 0, body: e.toString() };
  }
}

// Main runner
async function main() {

  // Health check
  await testEndpoint('/health');

  // CRM
  await testEndpoint('/api/crm/intakes');
  await testEndpoint('/api/crm/export.csv');

  // Certificates
  await testEndpoint('/api/certificates');
  await testEndpoint('/api/certificates/types');

  // E-File
  await testEndpoint('/api/efile/status');
  await testEndpoint('/api/efile/efin-profile');

  // IRS
  await testEndpoint('/api/irs/schema');
  await testEndpoint('/api/irs/memos');

  // Compliance
  await testEndpoint('/api/compliance/check');
  await testEndpoint('/api/compliance/requirements');

  // Social/Brand
  await testEndpoint('/api/social/metrics');
  await testEndpoint('/api/social/feed');

  // LMS
  await testEndpoint('/api/lms/courses');
  await testEndpoint('/api/lms/students');

  // Team
  await testEndpoint('/api/team');
  await testEndpoint('/api/team/regions');

  // Add more as needed for your endpoints

  console.log('\nAPI test script complete. Review output for errors or failed endpoints.');
}

main();

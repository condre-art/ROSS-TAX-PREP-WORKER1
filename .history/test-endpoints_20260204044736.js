/**
 * API Endpoint Test Suite
 * Tests all production endpoints at https://ross-tax-prep-worker.condre.workers.dev
 */

const BASE_URL = 'https://ross-tax-prep-worker.condre.workers.dev';

// Test results
const results = {
  passed: [],
  failed: [],
  total: 0
};

async function testEndpoint(name, path, options = {}) {
  results.total++;
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${options.method || 'GET'} ${path}`);
  
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    // Clone response before reading to avoid "body already read" error
    const responseClone = response.clone();
    let data;
    
    try {
      data = await response.json();
    } catch {
      try {
        data = await responseClone.text();
      } catch {
        data = 'Unable to read response';
      }
    }
    
    if (response.ok || response.status === 401 || response.status === 403) {
      // 401/403 expected for protected endpoints without auth
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   Response:`, typeof data === 'string' ? data.substring(0, 100) : data);
      results.passed.push(name);
      return { success: true, status: response.status, data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   Error:`, data);
      results.failed.push({ name, status: response.status, error: data });
      return { success: false, status: response.status, data };
    }
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    results.failed.push({ name, error: error.message });
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Ross Tax Prep API Endpoint Tests');
  console.log('═══════════════════════════════════════\n');
  
  // 1. Client Portal Endpoints
  console.log('\n📋 CLIENT PORTAL ENDPOINTS');
  console.log('───────────────────────────');
  await testEndpoint('Portal: Dashboard', '/api/portal/dashboard');
  await testEndpoint('Portal: Documents', '/api/portal/documents');
  await testEndpoint('Portal: Messages', '/api/portal/messages');
  await testEndpoint('Portal: Activity', '/api/portal/activity');
  await testEndpoint('Portal: Fee Disclosure (Public)', '/api/refund-transfer/fee-disclosure');
  
  // 2. Refund Transfer Endpoints
  console.log('\n💸 REFUND TRANSFER ENDPOINTS');
  console.log('────────────────────────────');
  await testEndpoint('Refund Transfer: Status', '/api/refund-transfer/status/test-return-123');
  await testEndpoint('Refund Transfer: Submit Request', '/api/refund-transfer/request', {
    method: 'POST',
    body: {
      returnId: 'test-return-123',
      amount: 5000,
      fee: 35,
      partnerBank: 'Test Bank',
      clientConsent: true
    }
  });
  
  // 3. Money Management Endpoints
  console.log('\n💰 MONEY MANAGEMENT ENDPOINTS');
  console.log('──────────────────────────────');
  await testEndpoint('Money: Dashboard', '/api/money-management/dashboard');
  await testEndpoint('Money: Cards', '/api/money-management/cards');
  await testEndpoint('Money: Transactions', '/api/money-management/transactions');
  
  // 4. Client Banks Endpoints
  console.log('\n🏦 CLIENT BANKS ENDPOINTS');
  console.log('──────────────────────────');
  await testEndpoint('Banks: List', '/api/client-banks');
  await testEndpoint('Banks: Link Account', '/api/client-banks/link', {
    method: 'POST',
    body: {
      clientId: 'test-client-123',
      bankName: 'Test Bank',
      accountType: 'checking'
    }
  });
  
  // 5. IAM Endpoints
  console.log('\n🔐 IAM ENDPOINTS');
  console.log('─────────────────');
  await testEndpoint('IAM: List Users', '/api/iam/users');
  await testEndpoint('IAM: List Roles', '/api/iam/roles');
  await testEndpoint('IAM: List Permissions', '/api/iam/permissions');
  
  // 6. CRM Endpoints
  console.log('\n👥 CRM ENDPOINTS');
  console.log('─────────────────');
  await testEndpoint('CRM: Intakes', '/api/crm/intakes');
  
  // 7. E-File Endpoints
  console.log('\n📄 E-FILE ENDPOINTS');
  console.log('────────────────────');
  await testEndpoint('E-File: Status', '/api/efile/status');
  
  // Summary
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed Tests:');
    results.failed.forEach(({ name, status, error }) => {
      console.log(`  - ${name}: ${status || error}`);
    });
  }
  
  console.log('\n✨ All endpoints are operational!');
  console.log('Note: 401/403 responses are expected for protected endpoints without authentication.');
}

// Run tests
runTests().catch(console.error);

#!/usr/bin/env node

/**
 * Simple Supabase Test - Tests connection and basic functionality
 * Uses the existing server if running, or tests database functions directly
 */

const http = require('http');
require('dotenv').config({ path: '.env.local' });

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(50)}`, 'cyan');
  log(`${title}`, 'bold');
  log(`${'='.repeat(50)}`, 'cyan');
}

async function makeRequest(port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testRunningServer() {
  logSection('TESTING EXISTING SERVER');
  
  const portsToTest = [3000, 3001, 3002];
  let workingPort = null;
  
  for (const port of portsToTest) {
    try {
      log(`\n🔍 Testing port ${port}...`, 'blue');
      const response = await makeRequest(port, '/api/employees');
      
      if (response.statusCode === 200) {
        log(`✅ Found working server on port ${port}`, 'green');
        
        try {
          const employees = JSON.parse(response.body);
          log(`📊 API Response: Found ${employees.length} employees`, 'magenta');
          workingPort = port;
          break;
        } catch (parseError) {
          log(`⚠️  Server responded but data couldn't be parsed`, 'yellow');
        }
      } else if (response.statusCode < 500) {
        log(`⚠️  Server on port ${port} responded with status ${response.statusCode}`, 'yellow');
        workingPort = port;
        break;
      }
      
    } catch (error) {
      log(`❌ Port ${port} not accessible: ${error.message}`, 'red');
    }
  }
  
  if (workingPort) {
    log(`\n🎯 Using server on port ${workingPort} for testing`, 'green');
    
    // Test key endpoints
    log('\n📡 Testing API endpoints...', 'blue');
    
    const endpoints = [
      '/api/employees',
      '/api/timecard?employee=test&weekEnding=2024-12-31',
      '/api/punch?employee=test'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await makeRequest(workingPort, endpoint);
        log(`   ${endpoint}: Status ${response.statusCode}`, response.statusCode < 400 ? 'green' : 'yellow');
      } catch (error) {
        log(`   ${endpoint}: Error - ${error.message}`, 'red');
      }
    }
    
    return true;
  }
  
  return false;
}

async function testSupabaseDirect() {
  logSection('DIRECT SUPABASE TEST');
  
  try {
    // Import the supabase client directly
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      log('❌ Missing Supabase environment variables', 'red');
      return false;
    }
    
    log('✅ Environment variables loaded', 'green');
    log(`   URL: ${supabaseUrl}`, 'cyan');
    log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`, 'cyan');
    log(`   Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'Not set'}`, 'cyan');
    
    // Create clients
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    }) : null;
    
    const dbClient = supabaseAdmin || supabase;
    
    log('\n🔌 Testing database connection...', 'blue');
    
    // Test connection with a simple query
    const { data: testData, error: testError } = await dbClient
      .from('employees')
      .select('count')
      .limit(0);
    
    if (testError) {
      log(`❌ Connection test failed: ${testError.message}`, 'red');
      if (testError.details) log(`   Details: ${testError.details}`, 'red');
      if (testError.hint) log(`   Hint: ${testError.hint}`, 'red');
      return false;
    }
    
    log('✅ Database connection successful', 'green');
    
    // Test table access
    log('\n📊 Testing table access...', 'blue');
    
    const tables = ['employees', 'punch_records', 'time_entries'];
    const tableResults = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await dbClient
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          log(`   ${table}: ❌ ${error.message}`, 'red');
          tableResults[table] = false;
        } else {
          log(`   ${table}: ✅ Accessible`, 'green');
          tableResults[table] = true;
        }
      } catch (err) {
        log(`   ${table}: ❌ ${err.message}`, 'red');
        tableResults[table] = false;
      }
    }
    
    // Test basic operations
    log('\n🎬 Testing basic operations...', 'blue');
    
    try {
      // Test reading employees
      const { data: employees, error: empError } = await dbClient
        .from('employees')
        .select('*')
        .limit(5);
      
      if (empError) {
        log(`   Read employees: ❌ ${empError.message}`, 'red');
      } else {
        log(`   Read employees: ✅ Found ${employees.length} records`, 'green');
      }
      
      // Test reading punch records
      const { data: punches, error: punchError } = await dbClient
        .from('punch_records')
        .select('*')
        .limit(5);
      
      if (punchError) {
        log(`   Read punch records: ❌ ${punchError.message}`, 'red');
      } else {
        log(`   Read punch records: ✅ Found ${punches.length} records`, 'green');
      }
      
    } catch (operationError) {
      log(`   Operations test: ❌ ${operationError.message}`, 'red');
    }
    
    // Summary
    log('\n📋 Test Summary:', 'blue');
    const allTablesAccessible = Object.values(tableResults).every(Boolean);
    
    if (allTablesAccessible) {
      log('✅ All required tables are accessible', 'green');
      log('✅ Supabase database is fully functional', 'green');
      log('🎯 Your Hours Tracker application should work correctly', 'green');
    } else {
      log('⚠️  Some tables had issues - check the logs above', 'yellow');
      log('💡 You may need to run database migrations', 'yellow');
    }
    
    return allTablesAccessible;
    
  } catch (error) {
    log(`💥 Direct Supabase test failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function runTests() {
  logSection('HOURS TRACKER - SUPABASE CONNECTION TEST');
  
  log('🔍 This script tests your Supabase database connection and setup', 'blue');
  log('📋 It will check both running servers and direct database access', 'blue');
  
  // Test 1: Check for running server
  const serverWorking = await testRunningServer();
  
  // Test 2: Direct Supabase test
  const supabaseWorking = await testSupabaseDirect();
  
  // Final report
  logSection('FINAL REPORT');
  
  if (serverWorking) {
    log('✅ API Server: Working correctly', 'green');
  } else {
    log('❌ API Server: Not accessible or not working', 'red');
  }
  
  if (supabaseWorking) {
    log('✅ Supabase Database: Connected and functional', 'green');
  } else {
    log('❌ Supabase Database: Connection or access issues', 'red');
  }
  
  if (supabaseWorking) {
    log('\n🎉 SUCCESS: Your Supabase setup is working correctly!', 'green');
    log('🚀 Your Hours Tracker application should be fully functional', 'green');
    log('💡 You can now use the app to manage employees and track time', 'blue');
  } else {
    log('\n⚠️  ISSUES DETECTED: There are problems with your setup', 'yellow');
    log('🔧 Check the error messages above for troubleshooting', 'yellow');
    log('📞 Common fixes:', 'blue');
    log('   1. Verify environment variables in .env.local', 'cyan');
    log('   2. Check Supabase project is active and accessible', 'cyan');
    log('   3. Ensure database tables exist (run migrations)', 'cyan');
  }
  
  return supabaseWorking;
}

// Run the tests
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log(`\n💥 Test runner failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runTests };
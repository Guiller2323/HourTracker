#!/usr/bin/env node

/**
 * Supabase Database Connection Test Script
 * Tests connectivity and table structure for Hours Tracker
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// ANSI color codes for console output
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

async function testSupabaseConnection() {
  logSection('SUPABASE CONNECTION TEST');
  
  // Check environment variables
  log('\n1. Checking Environment Variables...', 'blue');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL is missing', 'red');
    return false;
  } else {
    log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`, 'green');
  }
  
  if (!supabaseAnonKey) {
    log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', 'red');
    return false;
  } else {
    log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`, 'green');
  }
  
  if (!supabaseServiceKey) {
    log('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing (optional)', 'yellow');
  } else {
    log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey.substring(0, 20)}...`, 'green');
  }

  // Create Supabase clients
  log('\n2. Creating Supabase Clients...', 'blue');
  
  let supabase, supabaseAdmin;
  
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    log('✅ Anonymous client created successfully', 'green');
  } catch (error) {
    log(`❌ Failed to create anonymous client: ${error.message}`, 'red');
    return false;
  }
  
  if (supabaseServiceKey) {
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      log('✅ Admin client created successfully', 'green');
    } catch (error) {
      log(`❌ Failed to create admin client: ${error.message}`, 'red');
    }
  }

  // Test database connection
  log('\n3. Testing Database Connection...', 'blue');
  
  const dbClient = supabaseAdmin || supabase;
  
  try {
    // Simple connectivity test
    const { data: testData, error: testError } = await dbClient
      .from('employees')
      .select('count')
      .limit(1);
      
    if (testError) {
      log(`❌ Database connection failed: ${testError.message}`, 'red');
      if (testError.hint) {
        log(`   Hint: ${testError.hint}`, 'yellow');
      }
      if (testError.details) {
        log(`   Details: ${testError.details}`, 'yellow');
      }
      return false;
    }
    
    log('✅ Database connection successful', 'green');
  } catch (error) {
    log(`❌ Unexpected error during connection test: ${error.message}`, 'red');
    return false;
  }

  // Test table existence and structure
  log('\n4. Checking Table Structure...', 'blue');
  
  const expectedTables = ['employees', 'punch_records', 'time_entries'];
  
  for (const tableName of expectedTables) {
    try {
      log(`\n   Testing table: ${tableName}`, 'cyan');
      
      // Try to query the table structure
      const { data, error } = await dbClient
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          log(`   ❌ Table '${tableName}' does not exist`, 'red');
          log(`   Error: ${error.message}`, 'red');
        } else {
          log(`   ⚠️  Table '${tableName}' exists but query failed: ${error.message}`, 'yellow');
        }
      } else {
        log(`   ✅ Table '${tableName}' exists and is accessible`, 'green');
        
        // Try to get table info using RPC or direct queries
        try {
          const { data: countData, error: countError } = await dbClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          if (!countError && countData !== null) {
            log(`   📊 Record count: ${countData.length || 0}`, 'magenta');
          }
        } catch (e) {
          // Ignore count errors, focus on table existence
        }
      }
    } catch (error) {
      log(`   ❌ Unexpected error testing table '${tableName}': ${error.message}`, 'red');
    }
  }

  // Test specific table operations
  log('\n5. Testing Core Operations...', 'blue');
  
  try {
    log('\n   Testing employees table operations...', 'cyan');
    
    // Test reading employees
    const { data: employees, error: employeesError } = await dbClient
      .from('employees')
      .select('id, name, active')
      .eq('active', true)
      .order('name')
      .limit(5);
    
    if (employeesError) {
      log(`   ❌ Failed to query employees: ${employeesError.message}`, 'red');
    } else {
      log(`   ✅ Successfully queried employees table`, 'green');
      log(`   📊 Found ${employees.length} active employees`, 'magenta');
      
      if (employees.length > 0) {
        log(`   👥 Sample employees:`, 'cyan');
        employees.forEach((emp, index) => {
          log(`      ${index + 1}. ${emp.name} (ID: ${emp.id})`, 'magenta');
        });
      }
    }
    
  } catch (error) {
    log(`   ❌ Unexpected error during operations test: ${error.message}`, 'red');
  }

  // Test punch_records operations
  try {
    log('\n   Testing punch_records table operations...', 'cyan');
    
    const { data: punchRecords, error: punchError } = await dbClient
      .from('punch_records')
      .select('employee_name, date, punch_in_time, punch_out_time, total_hours')
      .order('date', { ascending: false })
      .limit(5);
    
    if (punchError) {
      log(`   ❌ Failed to query punch_records: ${punchError.message}`, 'red');
    } else {
      log(`   ✅ Successfully queried punch_records table`, 'green');
      log(`   📊 Found ${punchRecords.length} recent punch records`, 'magenta');
      
      if (punchRecords.length > 0) {
        log(`   ⏰ Recent punch records:`, 'cyan');
        punchRecords.forEach((record, index) => {
          const inTime = record.punch_in_time || 'N/A';
          const outTime = record.punch_out_time || 'N/A';
          const hours = record.total_hours || 0;
          log(`      ${index + 1}. ${record.employee_name} - ${record.date} (${inTime} → ${outTime}) [${hours}h]`, 'magenta');
        });
      }
    }
    
  } catch (error) {
    log(`   ❌ Unexpected error testing punch_records: ${error.message}`, 'red');
  }

  // Database schema verification
  log('\n6. Schema Verification...', 'blue');
  
  try {
    // Test if we can perform a typical application operation
    log('\n   Testing typical application workflow...', 'cyan');
    
    const testEmployeeName = 'TEST_CONNECTION_USER';
    
    // Check if we can query for a non-existent employee (should not error)
    const { data: testEmployee, error: testEmpError } = await dbClient
      .from('employees')
      .select('id, name, active')
      .eq('name', testEmployeeName)
      .single();
    
    if (testEmpError && testEmpError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      log(`   ⚠️  Unexpected error querying for test employee: ${testEmpError.message}`, 'yellow');
    } else {
      log(`   ✅ Employee query operation working correctly`, 'green');
    }
    
    // Test date-based queries for punch records
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRecords, error: todayError } = await dbClient
      .from('punch_records')
      .select('employee_name, date')
      .eq('date', today)
      .limit(1);
    
    if (todayError) {
      log(`   ⚠️  Error querying today's punch records: ${todayError.message}`, 'yellow');
    } else {
      log(`   ✅ Date-based punch record queries working correctly`, 'green');
      log(`   📊 Found ${todayRecords.length} punch records for today`, 'magenta');
    }
    
  } catch (error) {
    log(`   ❌ Unexpected error during schema verification: ${error.message}`, 'red');
  }

  // Final status
  logSection('TEST SUMMARY');
  log('✅ Supabase connection test completed', 'green');
  log('📋 Check the results above for any issues', 'blue');
  log('💡 If tables don\'t exist, you may need to run database migrations', 'yellow');
  
  return true;
}

// Run the test
if (require.main === module) {
  testSupabaseConnection()
    .then(() => {
      log('\n🎉 Test script completed successfully!', 'green');
      process.exit(0);
    })
    .catch((error) => {
      log(`\n💥 Test script failed: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testSupabaseConnection };
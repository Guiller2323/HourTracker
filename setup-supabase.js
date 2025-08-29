#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * Run this to set up your database schema
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Supabase Database Setup');
console.log('==========================\n');

// Read the schema file
const schemaPath = path.join(__dirname, 'supabase-schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Error: supabase-schema.sql not found!');
  console.log('Please make sure you\'re running this from the project root.');
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('📋 Database Schema Setup Instructions:');
console.log('=====================================\n');
console.log('1. Go to your Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/bxpbtkxoxogsxhtwiwtn/sql\n');
console.log('2. Click on "SQL Editor" in the left sidebar\n');
console.log('3. Copy and paste the following SQL script:\n');
console.log('```sql');
console.log(schema);
console.log('```\n');
console.log('4. Click "Run" to execute the script\n');
console.log('5. Verify that all tables were created successfully\n');

console.log('✅ Setup complete! Your database is ready for the application.');
console.log('\n💡 Next steps:');
console.log('   - Make sure your Vercel environment variables are set');
console.log('   - Test the application by adding an employee');
console.log('   - Check the /api/test endpoint to verify the connection');

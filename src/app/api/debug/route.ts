import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!anonKey,
      hasServiceKey: !!serviceKey,
      url: supabaseUrl
    });

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        details: { hasUrl: !!supabaseUrl, hasAnonKey: !!anonKey, hasServiceKey: !!serviceKey }
      }, { status: 500 });
    }

    // Test with service role key (admin)
    const adminClient = createClient(supabaseUrl, serviceKey || anonKey);
    
    // Test database connection
    const { data: tables, error: tablesError } = await adminClient
      .from('employees')
      .select('count')
      .limit(1);

    if (tablesError) {
      console.error('Database error:', tablesError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: tablesError.message,
        code: tablesError.code
      }, { status: 500 });
    }

    // Test insert (this will reveal RLS issues)
    const { data: insertTest, error: insertError } = await adminClient
      .from('employees')
      .insert({ name: 'TEST_EMPLOYEE_DELETE_ME' })
      .select();

    if (insertError) {
      console.error('Insert test failed:', insertError);
      return NextResponse.json({
        error: 'Insert test failed',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint
      }, { status: 500 });
    }

    // Clean up test record
    if (insertTest && insertTest[0]) {
      await adminClient
        .from('employees')
        .delete()
        .eq('id', insertTest[0].id);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Database connection and insert working properly',
      environment: {
        hasServiceKey: !!serviceKey,
        usingKey: serviceKey ? 'service' : 'anon'
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
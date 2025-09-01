import { NextRequest, NextResponse } from 'next/server';
import { addEmployee, getEmployees, deleteEmployee } from '@/lib/database';

export async function GET() {
  try {
  const employees = await getEmployees();
    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error getting employees:', error);
    return NextResponse.json(
      { error: 'Failed to get employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let name = '';
  try {
    const body = await request.json();
    name = body.name;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Employee name is required' },
        { status: 400 }
      );
    }

    // Log environment status for debugging
    console.log('Environment variables status:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    console.log('Attempting to add employee:', name.trim());
    const result = await addEmployee(name.trim());

    return NextResponse.json({
      success: true,
      employeeId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error adding employee:', error);

    // Handle unique constraint violation
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed') || error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: `Employee "${name}" already exists` },
          { status: 409 } // Conflict status code
        );
      }

      // Handle Supabase specific errors
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database not set up. Please run the schema setup script in Supabase.' },
          { status: 500 }
        );
      }

      if (error.message.includes('Missing Supabase environment variables')) {
        return NextResponse.json(
          { error: 'Server configuration error. Please check environment variables.' },
          { status: 500 }
        );
      }

      // Return the actual error message for debugging
      return NextResponse.json(
        { error: `Failed to add employee: ${error.message}` },
        { status: 500 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

  const result = await deleteEmployee(parseInt(employeeId));
    
    return NextResponse.json({ 
      success: true, 
      deletedRows: result.changes
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}

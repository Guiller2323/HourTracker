import { NextRequest, NextResponse } from 'next/server';
import { addEmployee, getEmployees, deleteEmployee } from '@/lib/db';

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

  const result = await addEmployee(name.trim());
    
    return NextResponse.json({ 
      success: true, 
      employeeId: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json(
        { error: `Employee "${name}" already exists` },
        { status: 409 } // Conflict status code
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

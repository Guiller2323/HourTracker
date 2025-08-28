import { NextRequest, NextResponse } from 'next/server';
import { recordPunch, getCurrentPunchStatus, getEmployees } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { employee, type } = await request.json();
    
    if (!employee || !type) {
      return NextResponse.json(
        { error: 'Employee name and punch type are required' },
        { status: 400 }
      );
    }

    // Check if employee is active
  const activeEmployees = await getEmployees();
  const isEmployeeActive = activeEmployees.some(emp => emp.name === employee);
    
    if (!isEmployeeActive) {
      return NextResponse.json(
        { error: 'Employee not found or inactive' },
        { status: 404 }
      );
    }

  const result = await recordPunch(employee, type);
  const newStatus = await getCurrentPunchStatus(employee);
    
    return NextResponse.json({ 
      success: true, 
      punchId: result.lastInsertRowid,
      status: newStatus
    });
  } catch (error) {
    console.error('Error recording punch:', error);
    return NextResponse.json(
      { error: 'Failed to record punch' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee = searchParams.get('employee');
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee name is required' },
        { status: 400 }
      );
    }

    // Check if employee is active
  const activeEmployees = await getEmployees();
  const isEmployeeActive = activeEmployees.some((emp: any) => emp.name === employee);
    
    if (!isEmployeeActive) {
      return NextResponse.json(
        { error: 'Employee not found or inactive' },
        { status: 404 }
      );
    }

  const status = await getCurrentPunchStatus(employee);
    
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error getting punch status:', error);
    return NextResponse.json(
      { error: 'Failed to get punch status' },
      { status: 500 }
    );
  }
}

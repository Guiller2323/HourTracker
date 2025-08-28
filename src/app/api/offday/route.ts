import { NextRequest, NextResponse } from 'next/server';
import { markOffDay } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { employeeName, date } = await request.json();
    
    if (!employeeName || !date) {
      return NextResponse.json(
        { error: 'Employee name and date are required' },
        { status: 400 }
      );
    }

  const result = await markOffDay(employeeName, date);
    
    return NextResponse.json({ 
      success: true, 
      recordId: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Error marking off day:', error);
    return NextResponse.json(
      { error: 'Failed to mark off day' },
      { status: 500 }
    );
  }
}

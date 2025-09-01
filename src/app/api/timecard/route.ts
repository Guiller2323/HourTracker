import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyTimecard, getEmployees } from '@/lib/database';
import { TIMEZONE } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeName = searchParams.get('employee');
    const weekEndingDate = searchParams.get('weekEnding');
    
    if (!employeeName) {
      return NextResponse.json(
        { error: 'Employee name is required' },
        { status: 400 }
      );
    }

    // Check if employee is active
  const activeEmployees = await getEmployees();
  const isEmployeeActive = activeEmployees.some(emp => emp.name === employeeName);
    
    if (!isEmployeeActive) {
      return NextResponse.json(
        { error: 'Employee not found or inactive' },
        { status: 404 }
      );
    }

    // Default to current week's Saturday if no date provided
    // Traditional timecard week runs Sunday to Saturday
    const weekEnding = weekEndingDate || (() => {
      const now = new Date();
      const zoned = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
      const saturday = new Date(zoned);
      const daysUntilSaturday = zoned.getDay() === 0 ? 6 : 6 - zoned.getDay();
      saturday.setDate(zoned.getDate() + daysUntilSaturday);
      return saturday.toISOString().split('T')[0];
    })();
    
  const timecard = await getWeeklyTimecard(employeeName, weekEnding);
  const totalHours = timecard.reduce((sum, record) => sum + record.total_hours, 0);
    
    return NextResponse.json({ 
      timecard,
      totalHours,
      weekEnding,
      employeeName
    });
  } catch (error) {
    console.error('Error getting timecard:', error);
    return NextResponse.json(
      { error: 'Failed to get timecard' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { exportTimecardToCSV } from '@/lib/database';

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

    // Default to current week's Saturday (traditional Sunday–Saturday week)
    const weekEnding = weekEndingDate || (() => {
      const today = new Date();
      const saturday = new Date(today);
      const daysUntilSaturday = today.getDay() === 0 ? 6 : 6 - today.getDay();
      saturday.setDate(today.getDate() + daysUntilSaturday);
      return saturday.toISOString().split('T')[0];
    })();
    
  const csvContent = await exportTimecardToCSV(employeeName, weekEnding);
    const fileName = `timecard_${employeeName.replace(/\s+/g, '_')}_${weekEnding}.csv`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}

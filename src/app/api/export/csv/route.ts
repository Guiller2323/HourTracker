import { NextRequest, NextResponse } from 'next/server';
import { exportTimecardToCSV } from '@/lib/db';

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

    // Default to current week's Sunday if no date provided
    const weekEnding = weekEndingDate || (() => {
      const today = new Date();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
      return sunday.toISOString().split('T')[0];
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

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface PunchRecord {
  id: number;
  employee_name: string;
  date: string;
  day_of_week: string;
  punch_in_time: string | null;
  punch_out_time: string | null;
  lunch_start_time: string | null;
  lunch_end_time: string | null;
  total_hours: number;
  is_off_day: boolean;
}

interface TimecardViewProps {
  selectedEmployee: string;
  weekEndingDate: string;
  onWeekChange: (date: string) => void;
}

export default function TimecardView({ 
  selectedEmployee, 
  weekEndingDate, 
  onWeekChange 
}: TimecardViewProps) {
  const [timecard, setTimecard] = useState<PunchRecord[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(false);

  // Convert decimal hours to HH:MM format
  const formatHours = (decimalHours: number): string => {
    if (decimalHours === 0) return '0:00';
    
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    
    // Handle edge case where rounding gives us 60 minutes
    if (minutes === 60) {
      return `${hours + 1}:00`;
    }
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchTimecard();
    }
  }, [selectedEmployee, weekEndingDate]);

  const fetchTimecard = async () => {
    setLoading(true);
    try {
      console.debug('Fetching timecard', { selectedEmployee, weekEndingDate });
      const response = await fetch(
        `/api/timecard?employee=${encodeURIComponent(selectedEmployee)}&weekEnding=${weekEndingDate}`
      );
      const data = await response.json();

      if (response.ok) {
        console.debug('Timecard data received', data);
        setTimecard(data.timecard);
        setTotalHours(data.totalHours);
      } else {
        // Clear timecard data when employee is inactive
        setTimecard([]);
        setTotalHours(0);
        
        if (response.status === 404) {
          toast.error(`Employee "${selectedEmployee}" is not active or not found`);
        } else {
          toast.error(data.error || 'Failed to fetch timecard');
        }
      }
    } catch (error) {
      console.error('Error fetching timecard:', error);
      setTimecard([]);
      setTotalHours(0);
      toast.error('Failed to fetch timecard');
    } finally {
      setLoading(false);
    }
  };

  const markOffDay = async (date: string) => {
    try {
      const response = await fetch('/api/offday', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeName: selectedEmployee,
          date
        }),
      });

      if (response.ok) {
        toast.success('Day marked as OFF');
        fetchTimecard();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to mark off day');
      }
    } catch (error) {
      console.error('Error marking off day:', error);
      toast.error('Failed to mark off day');
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await fetch(
        `/api/export/csv?employee=${encodeURIComponent(selectedEmployee)}&weekEnding=${weekEndingDate}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `timecard_${selectedEmployee.replace(/\s+/g, '_')}_${weekEndingDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV exported successfully');
      } else {
        toast.error('Failed to export CSV');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const printTimecard = () => {
    window.print();
  };

  // Generate all 7 days of the week (anchor at noon to avoid timezone drift)
  const generateWeekDays = () => {
    if (!weekEndingDate) return [] as { date: string; dayName: string; shortDay: string }[];
    const weekEnding = new Date(weekEndingDate + 'T12:00:00');
    const days: { date: string; dayName: string; shortDay: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(weekEnding);
      day.setDate(weekEnding.getDate() - i);
      const iso = new Date(day.getTime());
      const dateStr = new Date(iso.toISOString().slice(0, 10) + 'T12:00:00').toISOString().split('T')[0];
      days.push({
        date: dateStr,
        dayName: day.toLocaleDateString('en-US', { weekday: 'long' }),
        shortDay: day.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();

  const getRecordForDate = (date: string) => {
    return timecard.find(record => record.date === date);
  };

  if (!selectedEmployee) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-500">Select an employee to view their timecard</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 print:mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Employee Timecard</h2>
          <p className="text-gray-600">Week Ending: {new Date(weekEndingDate).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <input
            type="date"
            value={weekEndingDate}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                onWeekChange('');
                return;
              }
              const selectedDate = new Date(value + 'T12:00:00');
              const saturday = new Date(selectedDate);
              const daysUntilSaturday = selectedDate.getDay() === 6 ? 0 : (6 - selectedDate.getDay() + 7) % 7;
              saturday.setDate(selectedDate.getDate() + daysUntilSaturday);
              const saturdayStr = saturday.toISOString().split('T')[0];
              onWeekChange(saturdayStr);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={printTimecard}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      {/* Employee Info */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg print:border-2 print:border-green-600">
        <div className="text-lg font-bold text-green-800">
          Employee: {selectedEmployee}
        </div>
        <div className="text-sm text-green-600">
          Week Ending: {new Date(weekEndingDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading timecard...</div>
        </div>
      ) : (
        <>
          {/* Timecard Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border-2 border-green-600 text-sm">
              <thead>
                <tr className="bg-green-100">
                  <th className="border border-green-600 px-3 py-2 text-left font-bold">Day</th>
                  <th className="border border-green-600 px-3 py-2 text-center font-bold">Date</th>
                  <th className="border border-green-600 px-3 py-2 text-center font-bold">In</th>
                  <th className="border border-green-600 px-3 py-2 text-center font-bold">Out</th>
                  <th className="border border-green-600 px-3 py-2 text-center font-bold">Lunch Start</th>
                  <th className="border border-green-600 px-3 py-2 text-center font-bold">Lunch End</th>
                  <th className="border border-green-600 px-3 py-2 text-center font-bold">Hours</th>
                  <th className="border border-green-600 px-3 py-2 text-center font-bold print:hidden">Action</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map((day) => {
                  const record = getRecordForDate(day.date);
                  const isOffDay = record?.is_off_day;
                  
                  return (
                    <tr key={day.date} className={isOffDay ? 'bg-gray-50' : ''}>
                      <td className="border border-green-600 px-3 py-2 font-medium">
                        {day.dayName}
                      </td>
                      <td className="border border-green-600 px-3 py-2 text-center">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                      </td>
                      <td className="border border-green-600 px-3 py-2 text-center">
                        {isOffDay ? 'OFF' : (record?.punch_in_time || '')}
                      </td>
                      <td className="border border-green-600 px-3 py-2 text-center">
                        {isOffDay ? 'OFF' : (record?.punch_out_time || '')}
                      </td>
                      <td className="border border-green-600 px-3 py-2 text-center">
                        {isOffDay ? '' : (record?.lunch_start_time || '')}
                      </td>
                      <td className="border border-green-600 px-3 py-2 text-center">
                        {isOffDay ? '' : (record?.lunch_end_time || '')}
                      </td>
                      <td className="border border-green-600 px-3 py-2 text-center font-bold">
                        {isOffDay ? '0:00' : formatHours(record?.total_hours || 0)}
                      </td>
                      <td className="border border-green-600 px-3 py-2 text-center print:hidden">
                        {!isOffDay && (
                          <button
                            onClick={() => markOffDay(day.date)}
                            className="px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded"
                          >
                            Mark OFF
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-green-200">
                  <td colSpan={6} className="border border-green-600 px-3 py-2 text-right font-bold">
                    Total Hours:
                  </td>
                  <td className="border border-green-600 px-3 py-2 text-center font-bold text-lg">
                    {formatHours(totalHours)}
                  </td>
                  <td className="border border-green-600 print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Summary */}
          <div className="text-center text-sm text-gray-600 print:text-black">
            <p>Employee Signature: _________________________ Date: _____________</p>
            <p className="mt-2">Manager Signature: _________________________ Date: _____________</p>
          </div>
        </>
      )}
    </div>
  );
}

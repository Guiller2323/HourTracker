import { supabase, supabaseAdmin } from './supabase';
import { TIMEZONE } from './timezone';

export interface TimeEntry {
  id: number;
  employee_name: string;
  date: string;
  hours: number;
  lunch_taken: boolean;
}

export interface PunchRecord {
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

export interface Employee {
  id: number;
  name: string;
  active: boolean;
}

// Use admin client for database operations if available, otherwise use regular client
const dbClient = supabaseAdmin || supabase;

// Log which client is being used for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Using Supabase client:', supabaseAdmin ? 'Admin (Service Role)' : 'Regular (Anonymous)');
}

// Utility function to calculate hours between two times (12-hour strings like "9:00 AM")
function calculateHours(startTime: string, endTime: string, lunchStart?: string, lunchEnd?: string): number {
  const parseTime = (timeStr: string): Date => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(period === 'PM' && hours !== 12 ? hours + 12 : hours === 12 && period === 'AM' ? 0 : hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (lunchStart && lunchEnd) {
    const lunchStartTime = parseTime(lunchStart);
    const lunchEndTime = parseTime(lunchEnd);
    const lunchMinutes = (lunchEndTime.getTime() - lunchStartTime.getTime()) / (1000 * 60);
    totalMinutes -= lunchMinutes;
  }
  return Math.max(0, totalMinutes / 60);
}

export async function addEmployee(name: string) {
  // Check if employee already exists and is active
  const { data: existing } = await dbClient
    .from('employees')
    .select('id, active')
    .eq('name', name)
    .single();

  if (existing) {
    if (existing.active) {
      throw new Error(`Employee "${name}" already exists`);
    }
    // Reactivate employee
    const { error: updateError } = await dbClient
      .from('employees')
      .update({ active: true })
      .eq('id', existing.id);

    if (updateError) throw updateError;

    // Clean up old records
    await dbClient.from('punch_records').delete().eq('employee_name', name);
    await dbClient.from('time_entries').delete().eq('employee_name', name);

    return { lastInsertRowid: existing.id };
  }

  // Create new employee
  const { data, error } = await dbClient
    .from('employees')
    .insert({ name, active: true })
    .select('id')
    .single();

  if (error) throw error;
  return { lastInsertRowid: data.id };
}

export async function deleteEmployee(id: number) {
  const { data: employee } = await dbClient
    .from('employees')
    .select('name')
    .eq('id', id)
    .single();

  if (employee) {
    // Deactivate employee instead of deleting
    const { error: updateError } = await dbClient
      .from('employees')
      .update({ active: false })
      .eq('id', id);

    if (updateError) throw updateError;

    // Clean up records
    await dbClient.from('punch_records').delete().eq('employee_name', employee.name);
    await dbClient.from('time_entries').delete().eq('employee_name', employee.name);
  }

  return { changes: 1 };
}

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await dbClient
    .from('employees')
    .select('id, name, active')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function recordPunch(employeeName: string, punchType: 'IN' | 'OUT' | 'LUNCH' | 'LUNCH_END') {
  // Use configured timezone consistently
  const now = new Date();
  const tz = TIMEZONE;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now); // YYYY-MM-DD
  const time = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(now);
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(now);

  // Check if record exists for today
  const { data: existing } = await dbClient
    .from('punch_records')
    .select('id')
    .eq('employee_name', employeeName)
    .eq('date', date)
    .single();

  if (existing) {
    // Update existing record
    const updates: any = { updated_at: new Date().toISOString() };

    if (punchType === 'IN') updates.punch_in_time = time;
    if (punchType === 'OUT') updates.punch_out_time = time;
    if (punchType === 'LUNCH') updates.lunch_start_time = time;
    if (punchType === 'LUNCH_END') updates.lunch_end_time = time;

    const { error } = await dbClient
      .from('punch_records')
      .update(updates)
      .eq('employee_name', employeeName)
      .eq('date', date);

    if (error) throw error;

    if (punchType === 'OUT') {
      await updateTotalHours(employeeName, date);
    }

    return { lastInsertRowid: existing.id };
  }

  // Create new record
  const newRecord = {
    employee_name: employeeName,
    date,
    day_of_week: dayOfWeek,
    punch_in_time: punchType === 'IN' ? time : null,
    punch_out_time: punchType === 'OUT' ? time : null,
    lunch_start_time: punchType === 'LUNCH' ? time : null,
    lunch_end_time: punchType === 'LUNCH_END' ? time : null,
    total_hours: 0,
    is_off_day: false
  };

  const { data, error } = await dbClient
    .from('punch_records')
    .insert(newRecord)
    .select('id')
    .single();

  if (error) throw error;

  if (punchType === 'OUT') {
    await updateTotalHours(employeeName, date);
  }

  return { lastInsertRowid: data.id };
}

async function updateTotalHours(employeeName: string, date: string) {
  const { data: record } = await dbClient
    .from('punch_records')
    .select('punch_in_time, punch_out_time, lunch_start_time, lunch_end_time')
    .eq('employee_name', employeeName)
    .eq('date', date)
    .single();

  if (record && record.punch_in_time && record.punch_out_time) {
    const totalHours = calculateHours(
      record.punch_in_time,
      record.punch_out_time,
      record.lunch_start_time,
      record.lunch_end_time
    );

    const { error } = await dbClient
      .from('punch_records')
      .update({ total_hours: totalHours })
      .eq('employee_name', employeeName)
      .eq('date', date);

    if (error) throw error;
  }
}

export async function markOffDay(employeeName: string, date: string) {
  const localDate = new Date(date + 'T12:00:00');
  const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: TIMEZONE });

  const { data, error } = await dbClient
    .from('punch_records')
    .upsert({
      employee_name: employeeName,
      date,
      day_of_week: dayOfWeek,
      is_off_day: true,
      total_hours: 0,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'employee_name,date'
    })
    .select('id')
    .single();

  if (error) throw error;
  return { lastInsertRowid: data.id };
}

export async function getWeeklyTimecard(employeeName: string, weekEndingDate: string): Promise<PunchRecord[]> {
  const weekEnding = new Date(weekEndingDate); // This is Saturday
  const sunday = new Date(weekEnding);
  sunday.setDate(weekEnding.getDate() - 6); // Go back 6 days to get Sunday
  const sundayStr = sunday.toISOString().split('T')[0];
  const saturdayStr = weekEndingDate;

  const { data, error } = await dbClient
    .from('punch_records')
    .select('*')
    .eq('employee_name', employeeName)
    .gte('date', sundayStr)
    .lte('date', saturdayStr)
    .order('date');

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    employee_name: row.employee_name,
    date: row.date,
    day_of_week: row.day_of_week,
    punch_in_time: row.punch_in_time,
    punch_out_time: row.punch_out_time,
    lunch_start_time: row.lunch_start_time,
    lunch_end_time: row.lunch_end_time,
    total_hours: Number(row.total_hours || 0),
    is_off_day: !!row.is_off_day,
  }));
}

export async function getCurrentPunchStatus(employeeName: string): Promise<'OUT' | 'IN' | 'LUNCH'> {
  const tz = TIMEZONE;
  const now = new Date();
  const zonedNow = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const today = zonedNow.toISOString().split('T')[0];

  const { data: record } = await dbClient
    .from('punch_records')
    .select('punch_in_time, punch_out_time, lunch_start_time, lunch_end_time')
    .eq('employee_name', employeeName)
    .eq('date', today)
    .single();

  if (!record || !record.punch_in_time) return 'OUT';
  if (record.punch_out_time) return 'OUT';
  if (record.lunch_start_time && !record.lunch_end_time) return 'LUNCH';
  return 'IN';
}

export async function saveTimeEntry(employeeName: string, date: string, hours: number, lunchTaken: boolean) {
  const { data, error } = await dbClient
    .from('time_entries')
    .insert({
      employee_name: employeeName,
      date,
      hours,
      lunch_taken: lunchTaken
    })
    .select('id')
    .single();

  if (error) throw error;
  return { lastInsertRowid: data.id };
}

export async function getWeeklyReport(): Promise<TimeEntry[]> {
  const tz = TIMEZONE;
  const now = new Date();
  const zoned = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  // Traditional week: Sunday to Saturday, ending Saturday
  const saturday = new Date(zoned);
  const daysUntilSaturday = zoned.getDay() === 0 ? 6 : 6 - zoned.getDay();
  saturday.setDate(zoned.getDate() + daysUntilSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() - 6);
  const sundayStr = sunday.toISOString().split('T')[0];
  const saturdayStr = saturday.toISOString().split('T')[0];

  const { data, error } = await dbClient
    .from('time_entries')
    .select('id, employee_name, date, hours, lunch_taken')
  .gte('date', sundayStr)
  .lte('date', saturdayStr)
    .order('employee_name')
    .order('date');

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    employee_name: row.employee_name,
    date: row.date,
    hours: Number(row.hours || 0),
    lunch_taken: !!row.lunch_taken,
  }));
}

export async function exportTimecardToCSV(employeeName: string, weekEndingDate: string): Promise<string> {
  const records = await getWeeklyTimecard(employeeName, weekEndingDate);
  const headers = ['Employee Name','Date','Day','Punch In','Punch Out','Lunch Start','Lunch End','Total Hours','Status'];
  const csvRows = [headers.join(',')];
  records.forEach(record => {
    const row = [
      `"${record.employee_name}"`,
      record.date,
      record.day_of_week,
      record.punch_in_time || '',
      record.punch_out_time || '',
      record.lunch_start_time || '',
      record.lunch_end_time || '',
      record.total_hours.toFixed(2),
      record.is_off_day ? 'OFF' : 'WORK',
    ];
    csvRows.push(row.join(','));
  });
  const totalHours = records.reduce((sum, record) => sum + record.total_hours, 0);
  csvRows.push('');
  csvRows.push(`"Total Weekly Hours:",${totalHours.toFixed(2)}`);
  return csvRows.join('\n');
}

export default {};

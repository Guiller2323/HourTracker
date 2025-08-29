// Updated to use Supabase implementation
export type { TimeEntry, PunchRecord, Employee } from './db-supabase';
import * as supabaseDb from './db-supabase';

export function addEmployee(name: string) { return supabaseDb.addEmployee(name); }
export function deleteEmployee(id: number) { return supabaseDb.deleteEmployee(id); }
export function getEmployees() { return supabaseDb.getEmployees(); }
export function recordPunch(employeeName: string, punchType: 'IN' | 'OUT' | 'LUNCH' | 'LUNCH_END') { return supabaseDb.recordPunch(employeeName, punchType); }
export function markOffDay(employeeName: string, date: string) { return supabaseDb.markOffDay(employeeName, date); }
export function getWeeklyTimecard(employeeName: string, weekEndingDate: string) { return supabaseDb.getWeeklyTimecard(employeeName, weekEndingDate); }
export function getCurrentPunchStatus(employeeName: string) { return supabaseDb.getCurrentPunchStatus(employeeName); }
export function saveTimeEntry(employeeName: string, date: string, hours: number, lunchTaken: boolean) { return supabaseDb.saveTimeEntry(employeeName, date, hours, lunchTaken); }
export function getWeeklyReport() { return supabaseDb.getWeeklyReport(); }
export function exportTimecardToCSV(employeeName: string, weekEndingDate: string) { return supabaseDb.exportTimecardToCSV(employeeName, weekEndingDate); }
export default {} as any;

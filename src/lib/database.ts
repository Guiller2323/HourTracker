// Deprecated proxy to the Postgres implementation in lib/db to avoid breaking imports.
export type { TimeEntry, PunchRecord, Employee } from './db';
import * as pgdb from './db';

export function addEmployee(name: string) { return pgdb.addEmployee(name) as any; }
export function deleteEmployee(id: number) { return pgdb.deleteEmployee(id) as any; }
export function getEmployees() { return pgdb.getEmployees() as any; }
export function recordPunch(employeeName: string, punchType: 'IN' | 'OUT' | 'LUNCH' | 'LUNCH_END') { return pgdb.recordPunch(employeeName, punchType) as any; }
export function markOffDay(employeeName: string, date: string) { return pgdb.markOffDay(employeeName, date) as any; }
export function getWeeklyTimecard(employeeName: string, weekEndingDate: string) { return pgdb.getWeeklyTimecard(employeeName, weekEndingDate) as any; }
export function getCurrentPunchStatus(employeeName: string) { return pgdb.getCurrentPunchStatus(employeeName) as any; }
export function saveTimeEntry(employeeName: string, date: string, hours: number, lunchTaken: boolean) { return pgdb.saveTimeEntry(employeeName, date, hours, lunchTaken) as any; }
export function getWeeklyReport() { return pgdb.getWeeklyReport() as any; }
export function exportTimecardToCSV(employeeName: string, weekEndingDate: string) { return pgdb.exportTimecardToCSV(employeeName, weekEndingDate) as any; }
export default {} as any;

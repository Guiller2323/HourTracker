import { Pool } from 'pg';

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

type SQLClient = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number | null }>;
};

const POSTGRES_URL = process.env.POSTGRES_URL;
const USE_SQLITE = !POSTGRES_URL;

// Driver: Postgres (default for production/Vercel)
let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    if (!POSTGRES_URL) {
      throw new Error('Database not configured. Set POSTGRES_URL environment variable.');
    }
    pool = new Pool({ connectionString: POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

// Driver: SQLite (local fallback)
type SqliteDB = any;
let sqliteDb: SqliteDB | null = null;
function getSqlite() {
  if (!sqliteDb) {
    // Lazy require to avoid bundling native module on Vercel
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');
    sqliteDb = new Database(process.env.SQLITE_DB_PATH || 'timetracker.db');
    sqliteDb.pragma('journal_mode = WAL');
  }
  return sqliteDb;
}

const sql: SQLClient = USE_SQLITE
  ? {
      // Very small adapter that supports the subset of queries we issue
      query: async (text: string, params: any[] = []) => {
        const db = getSqlite();
        // Translate $1,$2,... to ? placeholders
        const converted = text.replace(/\$([0-9]+)/g, '?');
        const stmt = db.prepare(converted);
        const isSelect = /^\s*select/i.test(converted);
        const isReturning = /\breturning\b/i.test(converted);
        const isUpdateOrDelete = /^\s*(update|delete)/i.test(converted);
        const isInsert = /^\s*insert/i.test(converted);
        if (isSelect) {
          const rows = stmt.all(...params);
          return { rows, rowCount: rows.length };
        } else if (isInsert) {
          const info = stmt.run(...params);
          if (isReturning) {
            // When RETURNING is used, emulate by selecting last row
            // Note: our code only uses RETURNING id in a fresh insert
            return { rows: [{ id: info.lastInsertRowid }], rowCount: 1 } as any;
          }
          return { rows: [], rowCount: info.changes } as any;
        } else if (isUpdateOrDelete) {
          const info = stmt.run(...params);
          return { rows: [], rowCount: info.changes } as any;
        } else {
          // DDL
          stmt.run(...params);
          return { rows: [], rowCount: 0 } as any;
        }
      },
    }
  : { query: (text, params) => getPool().query(text, params) as any };

// Schema init
async function init() {
  if (USE_SQLITE) {
    // SQLite schema
    await sql.query(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await sql.query(`CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      date TEXT NOT NULL,
      hours REAL NOT NULL,
      lunch_taken INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await sql.query(`CREATE TABLE IF NOT EXISTS punch_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      date TEXT NOT NULL,
      day_of_week TEXT NOT NULL,
      punch_in_time TEXT,
      punch_out_time TEXT,
      lunch_start_time TEXT,
      lunch_end_time TEXT,
      total_hours REAL DEFAULT 0,
      is_off_day INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_punch_records_employee_date ON punch_records(employee_name, date)`);
    await sql.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_punch_employee_date ON punch_records(employee_name, date)`);
  } else {
    // Postgres schema
    await sql.query(`CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
    await sql.query(`CREATE TABLE IF NOT EXISTS time_entries (
      id SERIAL PRIMARY KEY,
      employee_name TEXT NOT NULL,
      date DATE NOT NULL,
      hours REAL NOT NULL,
      lunch_taken BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT now()
    )`);
    await sql.query(`CREATE TABLE IF NOT EXISTS punch_records (
      id SERIAL PRIMARY KEY,
      employee_name TEXT NOT NULL,
      date DATE NOT NULL,
      day_of_week TEXT NOT NULL,
      punch_in_time TEXT,
      punch_out_time TEXT,
      lunch_start_time TEXT,
      lunch_end_time TEXT,
      total_hours REAL DEFAULT 0,
      is_off_day BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )`);
    await sql.query(`CREATE INDEX IF NOT EXISTS idx_punch_records_employee_date ON punch_records(employee_name, date)`);
    // Optional unique to support upsert for off days
    await sql.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_punch_employee_date'
      ) THEN
        CREATE UNIQUE INDEX uniq_punch_employee_date ON punch_records(employee_name, date);
      END IF;
    END $$;`);
  }
}

// Initialize schema lazily on first DB use
let inited: Promise<void> | null = null;
async function ensureInit() {
  if (!inited) inited = init();
  await inited;
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
  await ensureInit();
  const existing = await sql.query('SELECT id, active FROM employees WHERE name = $1', [name]);
  if (existing.rows[0]) {
    if (existing.rows[0].active) throw new Error(`Employee "${name}" already exists`);
    await sql.query('UPDATE employees SET active = TRUE WHERE id = $1', [existing.rows[0].id]);
    await sql.query('DELETE FROM punch_records WHERE employee_name = $1', [name]);
    await sql.query('DELETE FROM time_entries WHERE employee_name = $1', [name]);
    return { lastInsertRowid: existing.rows[0].id } as { lastInsertRowid: number };
  }
  const inserted = await sql.query('INSERT INTO employees (name, active) VALUES ($1, TRUE) RETURNING id', [name]);
  return { lastInsertRowid: inserted.rows[0].id } as { lastInsertRowid: number };
}

export async function deleteEmployee(id: number) {
  await ensureInit();
  const res = await sql.query('SELECT name FROM employees WHERE id = $1', [id]);
  const name = res.rows[0]?.name as string | undefined;
  await sql.query('UPDATE employees SET active = FALSE WHERE id = $1', [id]);
  if (name) {
    await sql.query('DELETE FROM punch_records WHERE employee_name = $1', [name]);
    await sql.query('DELETE FROM time_entries WHERE employee_name = $1', [name]);
  }
  return { changes: 1 } as any;
}

export async function getEmployees(): Promise<Employee[]> {
  await ensureInit();
  const { rows } = await sql.query('SELECT id, name, active FROM employees WHERE active = TRUE ORDER BY name');
  return rows.map((row: any) => ({ id: row.id, name: row.name, active: !!row.active }));
}

export async function recordPunch(employeeName: string, punchType: 'IN' | 'OUT' | 'LUNCH' | 'LUNCH_END') {
  await ensureInit();
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

  const existingRes = await sql.query('SELECT id FROM punch_records WHERE employee_name = $1 AND date = $2', [employeeName, date]);
  const existing = existingRes.rows[0];
  if (existing) {
    const sets: string[] = [];
    const params: any[] = [];
    if (punchType === 'IN') { sets.push('punch_in_time = $1'); params.push(time); }
    if (punchType === 'OUT') { sets.push('punch_out_time = $1'); params.push(time); }
    if (punchType === 'LUNCH') { sets.push('lunch_start_time = $1'); params.push(time); }
    if (punchType === 'LUNCH_END') { sets.push('lunch_end_time = $1'); params.push(time); }
    sets.push('updated_at = now()');
    const setClause = sets.map((s, idx) => s.replace('$1', `$${idx + 1}`)).join(', ');
    params.push(employeeName, date);
    const whereEmployeePos = params.length - 1;
    const whereDatePos = params.length;
    await sql.query(`UPDATE punch_records SET ${setClause} WHERE employee_name = $${whereEmployeePos} AND date = $${whereDatePos}`, params);
    await updateTotalHours(employeeName, date);
    return { lastInsertRowid: existing.id } as any;
  }

  const insertRes = await sql.query(
    `INSERT INTO punch_records (
      employee_name, date, day_of_week, punch_in_time, punch_out_time,
      lunch_start_time, lunch_end_time, total_hours, is_off_day
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [
      employeeName,
      date,
      dayOfWeek,
      punchType === 'IN' ? time : null,
      punchType === 'OUT' ? time : null,
      punchType === 'LUNCH' ? time : null,
      punchType === 'LUNCH_END' ? time : null,
      0,
      false,
    ]
  );
  if (punchType === 'OUT') await updateTotalHours(employeeName, date);
  return { lastInsertRowid: insertRes.rows[0].id } as any;
}

async function updateTotalHours(employeeName: string, date: string) {
  const { rows } = await sql.query(
    'SELECT punch_in_time, punch_out_time, lunch_start_time, lunch_end_time FROM punch_records WHERE employee_name = $1 AND date = $2',
    [employeeName, date]
  );
  const record = rows[0];
  if (record && record.punch_in_time && record.punch_out_time) {
    const totalHours = calculateHours(record.punch_in_time, record.punch_out_time, record.lunch_start_time, record.lunch_end_time);
    await sql.query('UPDATE punch_records SET total_hours = $1 WHERE employee_name = $2 AND date = $3', [totalHours, employeeName, date]);
  }
}

export async function markOffDay(employeeName: string, date: string) {
  await ensureInit();
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  await sql.query(
    `INSERT INTO punch_records (employee_name, date, day_of_week, is_off_day, total_hours)
     VALUES ($1,$2,$3, TRUE, 0)
     ON CONFLICT (employee_name, date) DO UPDATE SET is_off_day = EXCLUDED.is_off_day, total_hours = 0, day_of_week = EXCLUDED.day_of_week, updated_at = now()`,
    [employeeName, date, dayOfWeek]
  );
  const { rows } = await sql.query('SELECT id FROM punch_records WHERE employee_name = $1 AND date = $2', [employeeName, date]);
  return { lastInsertRowid: rows[0]?.id } as any;
}

export async function getWeeklyTimecard(employeeName: string, weekEndingDate: string): Promise<PunchRecord[]> {
  await ensureInit();
  const weekEnding = new Date(weekEndingDate);
  const monday = new Date(weekEnding);
  monday.setDate(weekEnding.getDate() - 6);
  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = weekEndingDate;
  const { rows } = await sql.query(
    'SELECT * FROM punch_records WHERE employee_name = $1 AND date >= $2 AND date <= $3 ORDER BY date',
    [employeeName, mondayStr, sundayStr]
  );
  return rows.map((row: any) => ({
    id: row.id,
    employee_name: row.employee_name,
    date: row.date,
    day_of_week: row.day_of_week,
    punch_in_time: row.punch_in_time,
    punch_out_time: row.punch_out_time,
    lunch_start_time: row.lunch_start_time,
    lunch_end_time: row.lunch_end_time,
    total_hours: row.total_hours,
    is_off_day: !!row.is_off_day,
  }));
}

export async function getCurrentPunchStatus(employeeName: string): Promise<'OUT' | 'IN' | 'LUNCH'> {
  await ensureInit();
  const today = new Date().toISOString().split('T')[0];
  const { rows } = await sql.query(
    'SELECT punch_in_time, punch_out_time, lunch_start_time, lunch_end_time FROM punch_records WHERE employee_name = $1 AND date = $2',
    [employeeName, today]
  );
  const record = rows[0];
  if (!record || !record.punch_in_time) return 'OUT';
  if (record.punch_out_time) return 'OUT';
  if (record.lunch_start_time && !record.lunch_end_time) return 'LUNCH';
  return 'IN';
}

export async function saveTimeEntry(employeeName: string, date: string, hours: number, lunchTaken: boolean) {
  await ensureInit();
  const { rows } = await sql.query(
    'INSERT INTO time_entries (employee_name, date, hours, lunch_taken) VALUES ($1,$2,$3,$4) RETURNING id',
    [employeeName, date, hours, lunchTaken]
  );
  return { lastInsertRowid: rows[0].id } as any;
}

export async function getWeeklyReport(): Promise<TimeEntry[]> {
  await ensureInit();
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];
  const { rows } = await sql.query(
    'SELECT id, employee_name, date, hours, lunch_taken FROM time_entries WHERE date >= $1 AND date <= $2 ORDER BY employee_name, date',
    [mondayStr, sundayStr]
  );
  return rows.map((row: any) => ({
    id: row.id,
    employee_name: row.employee_name,
    date: row.date,
    hours: row.hours,
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

export default {} as any;

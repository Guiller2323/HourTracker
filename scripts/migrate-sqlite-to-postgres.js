#!/usr/bin/env node
/*
  One-time migration: SQLite (timetracker.db) -> Postgres (POSTGRES_URL)
  Usage:
    node scripts/migrate-sqlite-to-postgres.js
  Env:
    POSTGRES_URL=postgres://user:pass@host/db?sslmode=require
*/
const path = require('path');
const { Pool } = require('pg');
const Database = require('better-sqlite3');

async function main() {
  const POSTGRES_URL = process.env.POSTGRES_URL;
  if (!POSTGRES_URL) {
    console.error('Missing POSTGRES_URL env var. Aborting.');
    process.exit(1);
  }
  const dbPath = path.join(process.cwd(), 'timetracker.db');
  const sdb = new Database(dbPath, { readonly: true });
  const pool = new Pool({ connectionString: POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  const sql = (text, params) => pool.query(text, params);

  console.log('Ensuring Postgres schema...');
  await sql(`CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await sql(`CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    employee_name TEXT NOT NULL,
    date DATE NOT NULL,
    hours REAL NOT NULL,
    lunch_taken BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
  )`);
  await sql(`CREATE TABLE IF NOT EXISTS punch_records (
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
  await sql(`DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_punch_employee_date'
    ) THEN
      CREATE UNIQUE INDEX uniq_punch_employee_date ON punch_records(employee_name, date);
    END IF;
  END $$;`);

  console.log('Migrating employees...');
  const empRows = sdb.prepare('SELECT id, name, active FROM employees').all();
  let empCount = 0;
  for (const r of empRows) {
    await sql(
      `INSERT INTO employees(name, active)
       VALUES ($1,$2)
       ON CONFLICT(name) DO UPDATE SET active = EXCLUDED.active`,
      [r.name, !!r.active]
    );
    empCount++;
  }
  console.log(`Employees migrated: ${empCount}`);

  console.log('Migrating punch_records...');
  const prRows = sdb.prepare('SELECT * FROM punch_records').all();
  let prCount = 0;
  for (const r of prRows) {
    await sql(
      `INSERT INTO punch_records (
        employee_name, date, day_of_week, punch_in_time, punch_out_time,
        lunch_start_time, lunch_end_time, total_hours, is_off_day
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (employee_name, date) DO UPDATE SET
        day_of_week = EXCLUDED.day_of_week,
        punch_in_time = EXCLUDED.punch_in_time,
        punch_out_time = EXCLUDED.punch_out_time,
        lunch_start_time = EXCLUDED.lunch_start_time,
        lunch_end_time = EXCLUDED.lunch_end_time,
        total_hours = EXCLUDED.total_hours,
        is_off_day = EXCLUDED.is_off_day,
        updated_at = now()`,
      [
        r.employee_name,
        r.date,
        r.day_of_week,
        r.punch_in_time || null,
        r.punch_out_time || null,
        r.lunch_start_time || null,
        r.lunch_end_time || null,
        Number(r.total_hours || 0),
        !!r.is_off_day,
      ]
    );
    prCount++;
  }
  console.log(`Punch records migrated: ${prCount}`);

  console.log('Migrating time_entries...');
  const teRows = sdb.prepare('SELECT * FROM time_entries').all();
  let teCount = 0;
  for (const r of teRows) {
    await sql(
      `INSERT INTO time_entries (employee_name, date, hours, lunch_taken)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT DO NOTHING`,
      [r.employee_name, r.date, Number(r.hours || 0), !!r.lunch_taken]
    );
    teCount++;
  }
  console.log(`Time entries migrated: ${teCount}`);

  await pool.end();
  sdb.close();
  console.log('Migration complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

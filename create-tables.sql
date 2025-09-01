-- Simple table creation for Supabase
-- Copy and paste this into Supabase SQL Editor

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE punch_records (
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
);

CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  hours REAL NOT NULL,
  lunch_taken BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
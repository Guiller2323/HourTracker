-- Supabase Database Schema for HourTracker
-- Run this in your Supabase SQL Editor

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id SERIAL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  hours REAL NOT NULL,
  lunch_taken BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create punch_records table
CREATE TABLE IF NOT EXISTS punch_records (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_punch_records_employee_date ON punch_records(employee_name, date);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_punch_employee_date ON punch_records(employee_name, date);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE punch_records ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true);

-- Create policies for time_entries table
CREATE POLICY "Allow all operations on time_entries" ON time_entries FOR ALL USING (true);

-- Create policies for punch_records table
CREATE POLICY "Allow all operations on punch_records" ON punch_records FOR ALL USING (true);

-- Insert some sample data (optional)
-- INSERT INTO employees (name) VALUES ('John Doe'), ('Jane Smith') ON CONFLICT (name) DO NOTHING;

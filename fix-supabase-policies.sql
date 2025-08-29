-- Fix Supabase Row Level Security policies for Hour Tracker
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily to allow all operations
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE punch_records DISABLE ROW LEVEL SECURITY;

-- Or if you prefer to keep RLS enabled, create permissive policies:
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE punch_records ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on time_entries" ON time_entries FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on punch_records" ON punch_records FOR ALL USING (true);
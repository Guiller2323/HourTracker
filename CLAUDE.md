# Hours Tracker - Project Context

## Project Overview
A modern employee time-tracking desktop application built with Next.js, designed for easy desktop deployment with Tauri. The application provides a clean, manager-focused interface for tracking employee hours and generating weekly reports.

## Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon) for production; SQLite used only for optional local migration/desktop
- **Notifications**: react-toastify
- **Desktop Packaging**: Tauri (optional)
- **Build Tool**: Turbopack for development

## Project Structure - UPDATED
```
Hours-tracker/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── employees/route.ts    # Employee CRUD operations (GET, POST, DELETE)
│   │   │   ├── export/csv/route.ts   # CSV export functionality
│   │   │   ├── punch/route.ts        # Punch clock IN/OUT tracking
│   │   │   ├── timecard/route.ts     # Weekly timecard data
│   │   │   └── offday/route.ts       # OFF day marking
│   │   ├── globals.css               # Tailwind CSS imports and global styles
│   │   ├── layout.tsx                # Root layout component with metadata
│   │   ├── page.tsx                  # Main application with tabbed interface
│   │   └── page-desktop.tsx          # Desktop-specific layout
│   ├── components/
│   │   ├── PunchClock.tsx            # Real-time punch clock interface
│   │   ├── TimecardView.tsx          # Traditional timecard display
│   │   └── EmployeeManager.tsx       # Employee management with delete functionality
│   └── lib/
│       ├── db.ts                     # Postgres (Neon) database with timecard business logic (async)
│       └── database.ts               # Compatibility proxy to db.ts (kept to avoid breaking imports)
├── src-tauri/                        # Tauri desktop app configuration
│   ├── Cargo.toml                    # Rust dependencies
│   └── tauri.conf.json               # Tauri app configuration
├── .next/                            # Next.js build output (auto-generated)
├── .env.example                      # Env template (POSTGRES_URL)
├── package.json                      # Node.js dependencies and scripts
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
├── timetracker.db                    # Legacy SQLite file (optional: source for one-time migration)
├── scripts/
│   └── migrate-sqlite-to-postgres.js # One-time data migration script (SQLite → Postgres)
├── DEPLOYMENT.md                     # Vercel + Neon deployment guide
├── README.md                         # Comprehensive project documentation
├── SETUP_COMPLETE.md                 # Setup completion guide
└── CLAUDE.md                        # This context file
```

## Key Features - UPDATED
- **Traditional Timecard Interface**: Paper-style timecard with IN/OUT punch tracking
- **Real-time Punch Clock**: Large IN/OUT buttons with live time display
- **Employee Management**: Add employees and delete with confirmation dialogs
- **Weekly Timecard View**: Traditional green timecard format with print functionality
- **CSV Export**: Export timecard data for external processing
- **Time Calculations**: Automatic daily and weekly hour totals
- **OFF Day Marking**: Mark days as OFF when employees don't work
- **Modern UI**: Card-based interface with gradient backgrounds and smooth animations
- **PostgreSQL Database**: Neon-backed storage with punch_records and employees tables
- **Responsive Design**: Adapts to different screen sizes
- **Toast Notifications**: Success/error feedback for all user actions
- **Print-Ready Format**: Optimized for traditional timecard printing

## Database Schema (PostgreSQL) - UPDATED
```sql
-- Employees
CREATE TABLE IF NOT EXISTS employees (
   id SERIAL PRIMARY KEY,
   name TEXT NOT NULL UNIQUE,
   active BOOLEAN DEFAULT TRUE,
   created_at TIMESTAMPTZ DEFAULT now()
);

-- Punch records
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

-- Legacy time entries (kept for compatibility)
CREATE TABLE IF NOT EXISTS time_entries (
   id SERIAL PRIMARY KEY,
   employee_name TEXT NOT NULL,
   date DATE NOT NULL,
   hours REAL NOT NULL,
   lunch_taken BOOLEAN NOT NULL DEFAULT FALSE,
   created_at TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_punch_records_employee_date ON punch_records(employee_name, date);
-- Uniqueness for upsert behavior
-- (created as an index to avoid breaking existing data)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_punch_employee_date ON punch_records(employee_name, date);
```

## API Endpoints - UPDATED
- `GET /api/employees` - Retrieve all active employees
- `POST /api/employees` - Add a new employee
- `DELETE /api/employees?id={employeeId}` - Soft delete an employee
- `POST /api/punch` - Record punch IN/OUT with automatic time tracking
- `GET /api/timecard` - Retrieve weekly timecard data for selected employee
- `POST /api/offday` - Mark a day as OFF for an employee
- `GET /api/export/csv` - Export timecard data as CSV file

## Key Components & Files - UPDATED

### Core Application Files
- `src/app/page.tsx` - Main UI with tabbed interface (Punch Clock + Timecard View)
- `src/app/layout.tsx` - Root layout with app metadata and styling
- `src/lib/database.ts` - Database operations and timecard business logic

### React Components
- `src/components/PunchClock.tsx` - Real-time punch clock with IN/OUT tracking
- `src/components/TimecardView.tsx` - Traditional timecard display with print/export
- `src/components/EmployeeManager.tsx` - Employee management with delete functionality

### API Routes
- `src/app/api/employees/route.ts` - Employee CRUD operations
- `src/app/api/punch/route.ts` - Punch clock tracking
- `src/app/api/timecard/route.ts` - Weekly timecard data
- `src/app/api/offday/route.ts` - OFF day marking
- `src/app/api/export/csv/route.ts` - CSV export functionality

### Configuration Files
- `src-tauri/tauri.conf.json` - Tauri desktop app configuration
- `src-tauri/Cargo.toml` - Rust dependencies for Tauri
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js build configuration

### Documentation
- `README.md` - Complete project documentation with usage instructions
- `SETUP_COMPLETE.md` - Setup completion guide and feature overview
- `Claude.md` - This comprehensive context file for AI assistance

## Development Commands
```bash
npm run dev           # Start dev server (http://localhost:3000)
npm run dev:4001      # Start dev server on port 4001
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
# Data migration (optional, one-time)
npm run migrate:sqlite  # Requires POSTGRES_URL in env, migrates timetracker.db → Postgres
# Desktop (optional)
npx tauri dev         # Run desktop app in development
npx tauri build       # Build desktop application
```

Notes:
- This app uses server API routes; do not use static export for runtime use.
- No native modules required at runtime for DB; Postgres is used in production. SQLite is only used by the optional migration script.

## Business Logic - UPDATED
- **Punch Clock System**: Employees punch IN/OUT with automatic time tracking
- **Traditional Timecard Format**: Weekly grid showing daily IN/OUT times and totals
- **Employee Management**: Add new employees and delete existing ones (soft deletion)
- **Time Calculations**: Automatic daily hours calculation between punch pairs
- **Lunch Break Tracking**: Optional lunch punch tracking for accurate time calculation
- **OFF Day Support**: Mark entire days as OFF when employees don't work
- **Weekly Reporting**: Monday-Sunday weekly view with daily and total hours
- **CSV Export**: Export timecard data for external payroll systems
- **Print Functionality**: Print-optimized traditional timecard format
- **Data Persistence**: SQLite database with proper relationships and constraints

## UI Design Philosophy
- **Professional Aesthetic**: Blue to purple gradients, clean typography
- **Card-based Layout**: White cards with subtle shadows and rounded corners
- **Interactive Elements**: Hover effects, focus states, smooth transitions
- **Manager-focused**: Simple, intuitive interface for non-technical users
- **Color Scheme**: Blue/purple primary with green accents for success states

## Current Status - UPDATED (August 2025)
- ✅ Fully functional traditional timecard application
- ✅ Modern punch clock with real-time IN/OUT tracking
- ✅ Traditional paper-style timecard format implemented
- ✅ PostgreSQL (Neon) database with punch_records and employees tables
- ✅ Employee management with add/delete functionality
- ✅ CSV export and print-ready formatting
- ✅ Weekly timecard view with traditional green styling
- ✅ Manual entry tab removed per customer request
- ✅ Production build configured; Vercel + Neon ready
- ✅ Ready for desktop packaging with Tauri

### Recent Updates
#### August 28, 2025 — Cloud migration (Vercel + Neon)
1. Database migration to PostgreSQL (Neon)
   - Introduced `src/lib/db.ts` with async Postgres implementation using `pg`.
   - Kept `src/lib/database.ts` as a thin proxy to avoid breaking imports.
   - Schema created lazily at first use; added indexes and a unique index on `(employee_name, date)`.

2. API routes updated to async Postgres
   - Updated `employees`, `punch`, `timecard`, `offday`, and `export/csv` routes to use `lib/db`.

3. One-time data migration
   - Added `scripts/migrate-sqlite-to-postgres.js` to copy data from `timetracker.db` → Postgres.
   - Command: `POSTGRES_URL="postgres://..." npm run migrate:sqlite`.

4. Environment and deployment
   - Added `.env.example` with `POSTGRES_URL`.
   - Added `DEPLOYMENT.md` with Vercel + Neon steps.
   - Build does not require DB connectivity at build-time (lazy init), suitable for Vercel.

5. Repository
   - Pushed to GitHub: `https://github.com/Guiller2323/HourTracker.git` (branch: `main`).

2. Docs cleanup
   - Corrected DB schema (no employee_id FK; using employee_name).
   - Clarified that static export isn’t used for web runtime.

#### August 27, 2025
1. **Employee Delete Functionality Added**
   - Soft deletion in database (sets active=0)
   - Delete buttons in EmployeeManager component
   - Confirmation dialogs for safety
   - API endpoint: DELETE /api/employees?id={employeeId}

2. **Interface Streamlined**
   - Removed "Manual Entry" tab completely
   - Simplified to "Punch Clock" and "Timecard View" tabs only
   - Cleaned up legacy state and functions

3. **Traditional Timecard System Complete**
   - Implemented customer-requested traditional format
   - Green timecard styling matching paper timecards
   - IN/OUT punch tracking with time calculations
   - Print-optimized layout and CSV export
   - OFF day marking capability

4. **Punch/Timecard Reliability Fixes** (August 27, 2025, later)
   - Standardized Punch API to accept `{ employee, type }` and return `{ status }` in responses.
   - Aligned punch types between UI and DB: UI sends `IN | OUT | LUNCH | LUNCH_END`; DB updated to handle `LUNCH` (was `LUNCH_START`).
   - GET /api/punch now validates active employees using the `employee` query param and returns 404 for inactive.
   - GET /api/timecard blocks access for inactive employees and returns 404; TimecardView clears UI on 404 and shows a toast.
   - Fixed PunchClock button mismatch and status handling (removed LUNCH_START usage, added LUNCH_END flow).

5. **Employee Deletion Reactivation Semantics**
   - Deleting an employee now also purges their historical `punch_records` and legacy `time_entries` to prevent old rows reappearing after re-adding the same name.
   - Reactivating a previously deleted employee (same name) also clears prior records to start with a clean slate.
   - Behavior ensures re-created employees do not retain prior timecard history.

## Troubleshooting

See `TROUBLESHOOTING.md` for detailed guidance and common fixes.

## Deployment (Ubuntu self-host) - UPDATED

This section captures the exact steps and artifacts used to run Hours Tracker on a single Ubuntu host (this PC), fronted by Nginx, with the app served by Next.js on port 3000 and data stored in a local SQLite file.

### New supporting files
- `.env.production.example` — production env template
- `.env.production` — active env on host (PORT=3000, DB_PATH=./data/timetracker.db)
- `ecosystem.config.js` — PM2 process file to run `next start`
- `deploy/nginx-hours-tracker.conf` — Nginx site template (reverse proxy)
- `TROUBLESHOOTING.md` — common issues and fixes

### Build and run (production)
1) Install prerequisites (run once)
- Packages: git, build-essential, python3, Node.js 20, PM2
- Install Nginx for reverse proxy

2) Environment
- `.env.production` (in repo root):
   - `NODE_ENV=production`
   - `PORT=3000`
   - `DB_PATH=./data/timetracker.db`

3) Build and start
- Create data dir: `mkdir -p data`
- Install: `npm ci` (auto-rebuilds better-sqlite3 via postinstall)
- Build: `npm run build`
- Start with PM2: `pm2 start ecosystem.config.js && pm2 save && pm2 startup`

4) Reverse proxy (Nginx)
- Copy and enable site:
   - `/etc/nginx/sites-available/hours-tracker` from `deploy/nginx-hours-tracker.conf`
   - Replace `example.com` with your domain (hourtracker.net)
   - Symlink to `/etc/nginx/sites-enabled/`
   - Test and reload: `nginx -t && systemctl reload nginx`

5) HTTPS (Let’s Encrypt)
- After DNS points to this host: `certbot --nginx -d hourtracker.net -d www.hourtracker.net`

### Domain and DNS (hourtracker.net)
- Registrar: set A records to the server’s public IP.
   - `@` → `75.217.108.247`
   - `www` → `75.217.108.247`
- Propagation can take minutes to 24 hours.

### Operations cheatsheet
- Status: `pm2 status`
- Logs: `pm2 logs hours-tracker`
- Restart: `pm2 restart hours-tracker`
- Update: pull/rsync → `npm ci` → `npm run build` → `pm2 restart hours-tracker`
- Data file: `data/timetracker.db` (back up this file)

### Notes
- This section documents legacy on-box SQLite deployment. For serverless/cloud, use the Vercel + Neon flow below.
- When enabling login later, add `SESSION_SECRET` to `.env.production` and restart.

## Deployment (Vercel + Neon) — NEW
Summary (see `DEPLOYMENT.md` for full steps):
1) Create a Neon project and copy the pooled connection string (ends with `-pooler`, requires SSL).
2) In Vercel → Project → Settings → Environment Variables, add `POSTGRES_URL`.
3) Deploy via Git connection or CLI. No DB access is needed at build-time (schema initializes on first request).
4) Optional: run the SQLite → Postgres migration script locally before switching over.

## Potential Enhancements

### Phase 1: Traditional Timecard Format ✅ COMPLETED (August 2025)
**Successfully implemented based on customer feedback:**

1. **Timecard View Enhancement** ✅
   - Traditional timecard layout with IN/OUT punch times
   - Weekly view showing Monday-Sunday with daily IN/OUT columns
   - Time calculations showing daily hours and weekly totals
   - Employee name and week ending date display
   - Print-friendly format matching paper timecard style

2. **Punch Clock Interface** ✅
   - Clock IN/OUT buttons instead of manual hour entry
   - Real-time timestamp capture (9:00 AM, 1:30 PM format)
   - Automatic lunch break detection between punches
   - Visual indicator of current clock status (IN/OUT)
   - Employee selection with proper state management

3. **Enhanced Reporting** ✅
   - Weekly timecard printouts matching traditional format
   - CSV export functionality for external systems
   - Daily hours calculation between punch pairs
   - Missing punch detection and visual indicators
   - OFF day marking capability

4. **Employee Management** ✅
   - Add new employees to the system
   - Delete employees with confirmation dialogs
   - Soft deletion maintaining data integrity
   - Employee list management interface

### Phase 2: Additional Features - Future Enhancements
- **PDF generation** (Medium Priority - for formal records)
- **Edit punch times** (Medium Priority - for corrections)
- **Overtime calculation** (Medium Priority - over 8 hours/day or 40 hours/week)
- Date picker for historical entries
- Dark mode toggle
- Monthly reporting views
- Database backup/restore features

### Customer Requirements Analysis ✅ COMPLETED
From the customer images, all requirements have been met:
- ✅ Employee name and week ending date
- ✅ Daily IN/OUT time columns
- ✅ Daily hour calculations
- ✅ Weekly total hours
- ✅ Traditional green timecard styling
- ✅ Print-ready format
- ✅ OFF day marking capability
- ✅ Employee management with delete functionality
- ✅ CSV export for payroll integration

This application successfully meets the requirements for a modern, professional time-tracking solution that surpasses traditional desktop application aesthetics while maintaining simplicity for manager use.
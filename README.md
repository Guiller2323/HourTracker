# Employee Time Tracker

A modern time-tracking application built with Next.js that can be deployed as a web app on Vercel with Supabase or as a desktop application with Tauri.

## Features

- **Clean, Modern UI**: Card-based interface with gradient backgrounds and smooth animations
- **Employee Time Entry**: Input fields for employee name, hours worked, and lunch break tracking
- **Automatic Lunch Calculation**: Automatically deducts 0.5 hours when lunch break is selected
- **Weekly Reports**: Generate and view weekly time reports grouped by employee
- **Supabase Database**: Cloud database storage for all time entries (Vercel deployment)
- **SQLite Database**: Local database storage for desktop deployment
- **Toast Notifications**: User-friendly feedback for all actions
- **Responsive Design**: Works well on different screen sizes
- **Punch Clock**: Real-time employee punch in/out system

## Quick Start Options

### Option 1: Vercel Deployment with Supabase (Recommended for Web)

1. **Set up Supabase Database**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - In your Supabase dashboard, go to SQL Editor
   - Run the SQL script from `supabase-schema.sql` to create the database schema
   - Go to Settings > API to get your project URL and API keys

2. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Add the following environment variables in Vercel:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     ```
   - Deploy!

### Option 2: Local Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Option 3: Desktop App with Tauri

To package this as a lightweight desktop application:

1. Install Tauri CLI:
```bash
npm install --save-dev @tauri-apps/cli
```

2. Initialize Tauri:
```bash
npx tauri init
```

3. Configure `src-tauri/tauri.conf.json` to point to your Next.js build
4. Run in desktop mode:
```bash
npx tauri dev
```

5. Build desktop app:
```bash
npx tauri build
```

## Vercel Deployment

To deploy this application to Vercel with Supabase:

1. **Connect Repository**:
   - Import your GitHub repository to Vercel
   - Vercel will automatically detect it as a Next.js project

2. **Environment Variables**:
   In your Vercel dashboard, add these environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Database Setup**:
   - Run the SQL script from `supabase-schema.sql` in your Supabase SQL Editor
   - Enable Row Level Security (RLS) on all tables if needed

4. **Deploy**:
   - Push your changes to GitHub
   - Vercel will automatically redeploy with the new environment variables

## Usage

1. **Add Time Entry**:
   - Enter employee name
   - Enter hours worked (supports decimals like 8.5)
   - Check lunch break if employee took a 30-minute lunch (automatically deducts 0.5 hours)
   - Click "Add Entry" to save

2. **Generate Reports**:
   - Click "Generate Report" to view current week's entries
   - Report shows daily breakdown and weekly totals per employee

3. **Clear Form**:
   - Click "Clear" to reset all input fields

## Database

The application supports two database configurations:

### Supabase (Cloud - for Vercel deployment)
- **Connection**: Uses Supabase client library
- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for client-side operations
  - `SUPABASE_SERVICE_ROLE_KEY`: Secret service role key for server-side operations

### SQLite (Local - for desktop deployment)
- **Connection**: Local SQLite database file (`timetracker.db`)
- **Automatic Setup**: Database and tables are created automatically on first use

### Database Schema

```sql
-- Employees table
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Time entries table
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  hours REAL NOT NULL,
  lunch_taken BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Punch records table
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
```

## API Routes

- `GET/POST /api/employees` - Employee management (list, add, delete)
- `POST /api/punch` - Punch clock operations (in/out/lunch)
- `POST /api/offday` - Mark employee off days
- `GET /api/timecard` - Retrieve employee timecards
- `GET /api/export/csv` - Export timecard data to CSV

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (cloud) / SQLite (local)
- **Database Client**: @supabase/supabase-js / better-sqlite3
- **Notifications**: react-toastify
- **Build Tool**: Turbopack (for faster development)
- **Deployment**: Vercel (web) / Tauri (desktop)

## Project Structure

```
src/
  app/
    api/
      employees/
        route.ts          # API route for employee management
      export/
        csv/
          route.ts        # API route for CSV export
      offday/
        route.ts          # API route for marking off days
      punch/
        route.ts          # API route for punch clock operations
      timecard/
        route.ts          # API route for timecard operations
    globals.css           # Global styles and Tailwind imports
    layout.tsx            # Root layout component
    page-desktop.tsx      # Desktop-specific page component
    page.tsx              # Main application page
  components/
    EmployeeManager.tsx   # Employee management component
    PunchClock.tsx        # Punch clock interface component
    TimecardView.tsx      # Timecard viewing component
  lib/
    database.ts           # Database proxy (uses Supabase or SQLite)
    db-supabase.ts        # Supabase database implementation
    db.ts                 # Legacy PostgreSQL/SQLite implementation
    supabase.ts           # Supabase client configuration
supabase-schema.sql       # Database schema for Supabase setup
vercel.json              # Vercel deployment configuration
.env.local               # Environment variables (local development)
```

## Customization

- **Colors**: Edit the gradient colors in `src/app/page.tsx` and Tailwind classes
- **Database**: Modify `src/lib/database.ts` to change database schema or add features
- **UI Components**: All styling is in `src/app/page.tsx` using Tailwind CSS classes

## Notes

- The application tracks time by calendar week (Sunday to Saturday, week ending on Saturday)
- Timezone is configurable via `NEXT_PUBLIC_TIMEZONE` (client & server) or `TIMEZONE` (server fallback). Default: America/Chicago.
- Lunch breaks automatically deduct 0.5 hours from the entered time
- All times are stored in decimal format (e.g., 8.5 hours = 8 hours 30 minutes)
- The database is created locally and persists between sessions

## Troubleshooting

See `TROUBLESHOOTING.md` for common issues (JSON parse errors, better-sqlite3 rebuild, port conflicts) and quick fixes.

## Self-host on Ubuntu (quick guide)

1. Install prerequisites
```bash
sudo apt update
sudo apt install -y git build-essential python3 nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

2. Deploy app
```bash
sudo mkdir -p /var/www/hours-tracker && sudo chown $USER:$USER /var/www/hours-tracker
rsync -a --exclude node_modules --exclude .next ./ /var/www/hours-tracker/
cd /var/www/hours-tracker
npm ci
cp .env.production.example .env.production
mkdir -p data
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp $HOME
```

3. Nginx reverse proxy
```bash
sudo cp deploy/nginx-hours-tracker.conf /etc/nginx/sites-available/hours-tracker
sudo sed -i 's/example.com/yourdomain.com/g' /etc/nginx/sites-available/hours-tracker
sudo ln -s /etc/nginx/sites-available/hours-tracker /etc/nginx/sites-enabled/hours-tracker
sudo nginx -t && sudo systemctl reload nginx
```

4. HTTPS (Let’s Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

5. Updates
```bash
cd /var/www/hours-tracker
rsync -a --delete --exclude node_modules --exclude .next ~/Desktop/Hours-tracker/ ./
npm ci
npm run build
pm2 restart hours-tracker
```

Optional: temporary protection without login
- Add Nginx basic auth until app auth is ready.
- If you want, create a `deploy/nginx-basic-auth.txt` and I can wire it up.

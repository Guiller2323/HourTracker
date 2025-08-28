# Employee Time Tracker

A modern time-tracking desktop application built with Next.js and designed for easy desktop deployment with Tauri.

## Features

- **Clean, Modern UI**: Card-based interface with gradient backgrounds and smooth animations
- **Employee Time Entry**: Input fields for employee name, hours worked, and lunch break tracking
- **Automatic Lunch Calculation**: Automatically deducts 0.5 hours when lunch break is selected
- **Weekly Reports**: Generate and view weekly time reports grouped by employee
- **SQLite Database**: Local database storage for all time entries
- **Toast Notifications**: User-friendly feedback for all actions
- **Responsive Design**: Works well on different screen sizes

## Getting Started

### Development Server

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Desktop App with Tauri (Optional)

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

The application uses SQLite for local data storage. The database file (`timetracker.db`) is created automatically in the project root when you first add an entry.

### Database Schema

```sql
CREATE TABLE time_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_name TEXT NOT NULL,
  date TEXT NOT NULL,
  hours REAL NOT NULL,
  lunch_taken INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Routes

- `POST /api/saveEntry` - Save a new time entry
- `GET /api/getReport` - Retrieve current week's entries

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: better-sqlite3
- **Notifications**: react-toastify
- **Build Tool**: Turbopack (for faster development)

## Project Structure

```
src/
  app/
    api/
      getReport/
        route.ts          # API route for fetching weekly reports
      saveEntry/
        route.ts          # API route for saving time entries
    globals.css           # Global styles and Tailwind imports
    layout.tsx            # Root layout component
    page.tsx              # Main application page
  lib/
    database.ts           # Database utilities and functions
```

## Customization

- **Colors**: Edit the gradient colors in `src/app/page.tsx` and Tailwind classes
- **Database**: Modify `src/lib/database.ts` to change database schema or add features
- **UI Components**: All styling is in `src/app/page.tsx` using Tailwind CSS classes

## Notes

- The application tracks time by calendar week (Monday to Sunday)
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

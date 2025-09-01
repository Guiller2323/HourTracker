# Troubleshooting

Quick checks
- Server running: visit http://localhost:3000
- Node version: 18+ (project tested on Node 20)
- Use `npm run dev` (dev) or `npm run start` (prod). Don’t use static export for runtime APIs.

## 1) Console SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
Cause
- A client tried to parse JSON but the server returned an HTML page (often 404/500).

Diagnose
- Browser DevTools → Network → XHR/Fetch → click the failing call.
  - Check Status (should be 2xx) and Content-Type (should be application/json).
  - Note the URL path; ensure it begins with `/api/...` and the route exists.

Fix
- Ensure the dev/prod server is running (not a static export).
- Verify fetch paths use leading slash: `/api/employees`, not `api/employees`.
- Handle non-JSON endpoints properly (CSV): use `response.blob()` not `response.json()`.

## 2) ERR_DLOPEN_FAILED / "Module did not self-register" from better-sqlite3
Cause
- Native addon compiled for a different Node ABI.

Fix
```bash
npm rebuild better-sqlite3
```
- Restart the dev server after rebuild.
- We added a `postinstall` script to auto-rebuild after `npm install`.
- Ensure Node 18+ (current tested: v20.x).

## 3) Port already in use (EADDRINUSE: 3000)
Use an alternate port:
```bash
npm run dev -- -p 4001
# or
npm run dev:4001
```

## 4) Verify API routes quickly
Optional checks from a terminal:
```bash
curl -i http://localhost:3000/api/employees
curl -i "http://localhost:3000/api/punch?employee=Alice"
```
Expected: HTTP 200 with `application/json` (except CSV export which is `text/csv`).

## 5) Database file issues (SQLite)
- The DB file `timetracker.db` is created in the project root. Ensure the directory is writable.
- If you need a clean slate, stop the server and delete `timetracker.db`; it will be recreated on next run.

## 6) CSV export returns garbled text
- That’s expected; it’s a file. In the browser, fetch as `blob()` and download. The UI already does this.

## 7) Still stuck?
- Share the failing URL, HTTP status, and the console stack trace (file/line of `response.json()`), and we can pinpoint the exact cause.

## 8) Week ending shows Friday or punches appear on wrong day
Symptoms
- Timecard header shows Week Ending on Friday instead of Saturday.
- Week range or rows include the wrong days (e.g., Sunday 8/31 shown when the week should end Saturday 9/6).
- Punches recorded on Monday appear under Sunday in the timecard.

Root cause
- Mismatched week logic and timezone drift:
  - Some code used Monday–Sunday while others used Sunday–Saturday.
  - Date computations used local/UTC without a fixed timezone, causing day shifts around midnight UTC.

Fix implemented
- Standardize to Sunday–Saturday with week ending on Saturday across app:
  - Frontend `TimecardView` snaps any picked date to Saturday and generates days anchored at noon to avoid timezone drift.
  - API defaults (timecard, CSV) compute week ending in America/New_York (ET).
  - `getCurrentPunchStatus` also uses ET for today to match `recordPunch`.
  - README/tests updated to reflect Saturday week ending.

How to verify
1) In the UI, select any date in the timecard date picker. The Week Ending should display the Saturday of that week (e.g., 9/6/2025).
2) The table should list Sunday → Saturday for that week (e.g., 8/31 to 9/6) and Monday punches show on Monday.
3) CSV export for the same employee/week lists dates in the same Sunday→Saturday range.

If you still see Friday
- Hard refresh the page (clear cached JS).
- Ensure system time and timezone are correct.
- Check server logs for errors and confirm you're on the latest main commit.

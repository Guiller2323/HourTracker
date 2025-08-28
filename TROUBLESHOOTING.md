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

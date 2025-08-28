# Deploy to Vercel + Neon (PostgreSQL)

## 1) Create a Neon database (free)
- Go to neon.tech and create a new project.
- Copy the pooled connection string (it usually ends with `-pooler` and requires SSL).

## 2) Configure environment variables
- In Vercel project settings, add:
  - `POSTGRES_URL` = your Neon pooled connection string (include `sslmode=require`).
- Locally, copy `.env.example` to `.env.local` and fill `POSTGRES_URL` if you want to run against Neon.

## 3) Migrate existing SQLite data (optional)
- If you have data in `timetracker.db`, run the script once:

```
POSTGRES_URL="postgres://..." node scripts/migrate-sqlite-to-postgres.js
```

## 4) Deploy to Vercel
- `vercel` or connect the Git repo and push. The build requires no DB at build-time (lazy init).

Notes:
- The app uses Postgres in production. The old `lib/database.ts` remains as a proxy for compatibility.
- API routes are async; DB schema is auto-initialized at first use.

// Centralized timezone configuration for both server and client
// Usage: set NEXT_PUBLIC_TIMEZONE="America/Chicago" (client & server)
// or TIMEZONE="America/Chicago" (server-only fallback)

export function getTimezone(): string {
  // NEXT_PUBLIC_TIMEZONE is available on client and server
  // TIMEZONE is server-only; used as fallback on the server
  const tz = process.env.NEXT_PUBLIC_TIMEZONE || process.env.TIMEZONE || 'America/Chicago';
  return tz;
}

export const TIMEZONE = getTimezone();

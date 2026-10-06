// Schema initialization is handled by Tiltfile via db/schema.sql
// This file is kept as a no-op for backward compatibility with initDb()
//
// To modify the database schema:
//   1. Edit /home/simon/repos/foodflow/environments/dev/db/schema.sql
//   2. Tilt will DROP and recreate the database on next startup
//   3. Seed data will be re-loaded automatically
//
// See db/schema.sql for the authoritative schema definition.

export async function initSchema(): Promise<void> {
  // Schema is applied by Tiltfile from db/schema.sql
  // No-op here to keep initDb() interface unchanged
}

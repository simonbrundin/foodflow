# Database Schema

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Authoritative PostgreSQL schema — edited to change the schema |
| `diagram.sql` | Simplified schema for visualization tools |
| `view.html` | **Auto-generated** — redirects to ChartDB with schema in URL |

## Schema Changes

1. Edit `schema.sql` (the authoritative source)
2. Restart Tilt: `schema.sql` is applied automatically
3. Open **http://localhost:8080/view.html** to see the updated schema

## ChartDB Visualization

### Recommended entry point
**http://localhost:8080/view.html** — opens ChartDB with the schema auto-loaded.

No manual import needed. The schema is encoded in the URL fragment (`#s=...`).

### How it works
- `diagram.sql` is compressed (deflate) and base64url-encoded into a ~1100 char token
- The token is embedded in the redirect URL: `http://localhost:3501/#s=<token>`
- ChartDB decodes the token and renders the schema
- Works in any browser/tab since it's URL-based

### After schema changes
Re-open **http://localhost:8080/view.html** (or refresh) to get the updated schema.

### Direct URL (shareable)
The ChartDB URL with embedded schema is shareable — anyone with the URL sees the same diagram.

## Seed Data

Loaded automatically by Nuxt on startup:
- `src/nuxt/server/utils/seed-*.ts`

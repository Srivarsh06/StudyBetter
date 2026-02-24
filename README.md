# studyBetter(test concept – single user, no login)

Chrome extension + Next.js dashboard for tracking study sessions. **No Supabase, no user accounts.** One person runs the app at a time; data is stored in a JSON file on the dashboard server.

## Repo structure

- **extension/** – Chrome extension (Manifest V3)
- **dashboard/** – Next.js 14 app (Chart.js, file-based storage)
- **supabase/** – Optional SQL schema (only if you later add Supabase back)

## Extension

1. Open `chrome://extensions/` → **Developer mode** → **Load unpacked** → select the `extension` folder.
2. In the popup, set **Dashboard URL** to your dashboard (e.g. `http://localhost:3000` when running locally).
3. Start/stop sessions; when you **Stop Session**, data is POSTed to the dashboard.

## Dashboard (no login)

1. From `dashboard/`: run `npm install` then `npm run dev`.
2. Open [http://localhost:3000](http://localhost:3000). You go straight to the dashboard (no login).
3. Sessions are stored in `dashboard/data/sessions.json`. The extension syncs to `POST /api/sync-session`.

**Note:** File storage works when running locally. On Vercel (or other serverless hosts), the filesystem is not persistent, so data would not survive between requests unless you switch back to a database (e.g. Supabase).

## Testing

- **Automated (dashboard):** From `dashboard/` run `npm test`. Covers data layer, burnout formula, and `POST /api/sync-session`.
- **Example data:** Run `npm run seed` in `dashboard/` to fill `data/sessions.json` with example sessions, then check Dashboard, Analytics, Performance, Burnout.
- **Full manual plan:** See [docs/TEST-PLAN.md](docs/TEST-PLAN.md) for step-by-step test cases for all features.

## FUTURE MODIFICATIONS

For this **single-user, no-login test concept**: **no** currently the dashboard uses a local JSON file and does not need Supabase or any external database. But we plan on implementing multi-user/ hosted deployment with persistent data.


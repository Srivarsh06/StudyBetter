# Study Efficiency Tracker – Test Plan

Use this to test all features with example data and flows. Automated tests cover the dashboard data layer, burnout formula, and sync API; the rest is manual.

---

## 1. Automated tests (dashboard)

From `dashboard/` run:

```bash
npm test
```

**Coverage:**

| Test suite | What it checks |
|------------|----------------|
| `lib/data.test.js` | `getSessions()` empty/file/sort/wrapper format; `addSession()` creates session with id, defaults, tab_logs, append order. Uses temp file via `SESSIONS_FILE_OVERRIDE`. |
| `lib/burnout.test.js` | `computeBurnoutScore()`: 0 for empty; 0 for no risk; +10 per late-night (UTC 22:00–04:00); +20 declining focus (last 3); +30 low effective ratio (avg &lt; 0.5); combined and clamped 0–100. |
| `app/api/sync-session/route.test.js` | POST 400 when session or start_time/end_time missing; POST 200 stores session + tab_logs; minimal payload accepted. |

**Example data:** `dashboard/test/fixtures/exampleSessions.js` defines high-focus, low-focus, late-night, declining-trend, low-ratio, minimal, and mixed-category sessions plus tab_logs for API and seed.

---

## 2. Seed example data (dashboard)

From `dashboard/`:

```bash
npm run seed
```

This writes 9 example sessions to `data/sessions.json`. Then start the app and check each page.

---

## 3. Manual tests – Dashboard (with seeded data)

After `npm run seed` and `npm run dev`, open http://localhost:3000.

### 3.1 Dashboard page (`/dashboard`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/dashboard` | No login; page loads. |
| 2 | Check “Sessions (last 10)” | Shows 9 (or 10 if you had prior data). |
| 3 | Check “Total effective time” | Sum of effective_time of recent sessions (minutes). |
| 4 | Check “Avg focus score” | Average of focus_score of recent sessions. |
| 5 | Check table | Rows: Start, Subject, Total, Effective, Focus. At least one subject e.g. “Linear Algebra”, “Essay”, “Cramming”. |
| 6 | Check “Extension sync” hint | Text about setting Dashboard URL and ending session. |

### 3.2 Analytics page (`/analytics`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/analytics` | Page loads. |
| 2 | Check “Effective study time (last 14)” bar chart | Bars for last 14 sessions (effective minutes). |
| 3 | Check “Focus score (last 14)” line chart | Line 0–100 for focus_score. |
| 4 | Check “Time by category (%)” doughnut | Academic / Distracting / Neutral segments (from seeded tab_logs). |

### 3.3 Performance page (`/performance`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/performance` | Page loads. |
| 2 | Check line chart | Two series: Focus score and Effective ratio (%) for last 21 sessions. |

### 3.4 Burnout page (`/burnout`)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open `/burnout` | Page loads. |
| 2 | Check “Burnout score” | Number 0–100 (with seeded data: late night + declining + low ratio can yield &gt; 60). |
| 3 | If score &gt; 60 | Warning: “You may be experiencing burnout. Consider taking a rest day.” |
| 4 | Check “Late‑night sessions” | Count of sessions with start_time 22:00–04:00 UTC. |
| 5 | Check “Declining focus trend” | Yes if last 3 sessions have strictly decreasing focus_score. |
| 6 | Check “Low effective ratio” | Yes if average (effective_time / total_time) &lt; 0.5. |

---

## 4. Manual tests – Sync API

Use curl or Postman.

### 4.1 POST /api/sync-session – success

```bash
curl -X POST http://localhost:3000/api/sync-session \
  -H "Content-Type: application/json" \
  -d '{
    "session": {
      "start_time": "2025-02-22T10:00:00Z",
      "end_time": "2025-02-22T11:00:00Z",
      "total_time": 3600,
      "effective_time": 2800,
      "focus_score": 78,
      "burnout_score": 0,
      "subject_label": "Test Subject"
    },
    "tab_logs": [
      {
        "domain": "docs.google.com",
        "category": "academic",
        "time_spent": 1800,
        "is_important": true,
        "timestamp": "2025-02-22T10:30:00Z"
      }
    ]
  }'
```

**Expected:** `200`, body `{ "success": true, "session_id": "<uuid>" }`. Reload `/dashboard` and see the new session in the table.

### 4.2 POST /api/sync-session – validation

```bash
curl -X POST http://localhost:3000/api/sync-session \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:** `400`, body includes “missing” or “start_time” or “end_time”.

---

## 5. Manual tests – Extension

Load the extension from `extension/` in Chrome (`chrome://extensions` → Load unpacked). Set Dashboard URL to `http://localhost:3000` (with dashboard running).

### 5.1 Session start/stop

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open popup | “No active session”, Start enabled, Stop disabled. |
| 2 | Click “Start Session” | “Session active”, Stop enabled, Start disabled. |
| 3 | (Optional) Enter subject | e.g. “Math”. |
| 4 | Click “Stop Session” | Back to “No active session”; notification with focus score and effective time. |
| 5 | Check dashboard | New session in table (if Dashboard URL was set and sync succeeded). |

### 5.2 Tab tracking and categories

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start session. | |
| 2 | Open `docs.google.com` | Counted as academic (no block). |
| 3 | Open `en.wikipedia.org` | Counted as neutral. |
| 4 | Open `reddit.com` or `youtube.com` (non-academic) | Counted as distracting; soft delay or hard block if enabled. |
| 5 | Stop session | Focus score and effective time reflect time and categories. |

### 5.3 Important tab (star)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start session, open any page. | Floating ⭐ bottom-right. |
| 2 | Click star | Star turns green (tab marked important). |
| 3 | Click again | Star back to blue (not important). |
| 4 | Switch between two starred tabs | No penalty for important→important. |

### 5.4 Soft delay mode

| Step | Action | Expected |
|------|--------|----------|
| 1 | Enable “Soft Delay Mode”, disable Hard Block. Start session. | |
| 2 | Open a distracting site (e.g. reddit.com) | Full-page overlay: “You are in a study session.” and 10s countdown. |
| 3 | Wait for countdown | Overlay disappears, page usable. |

### 5.5 Hard block mode

| Step | Action | Expected |
|------|--------|----------|
| 1 | Enable “Hard Block Mode”, disable Soft Delay. Start session. | |
| 2 | Open a distracting site | Tab redirects to “Deep Study Mode” page (extension page). |
| 3 | Click “Exit Study Session” | Session ends; tab may go to about:blank. |

### 5.6 YouTube academic (content-based)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start session. Open a YouTube video whose title/description contain e.g. “lecture”, “tutorial”, “physics”. | After a short delay, tab treated as academic: no overlay/block, time not counted as distracting. |
| 2 | Open a YouTube video with no such keywords | Treated as distracting (soft delay or hard block if enabled). |

### 5.7 Idle

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start session, focus an academic/neutral tab. | |
| 2 | Do not move mouse/keyboard for 60+ seconds. | |
| 3 | Move mouse again. | Idle time not counted as effective; total time includes it. |
| 4 | Stop session | Effective time &lt; total time by roughly idle duration. |

### 5.8 Sync after session end

| Step | Action | Expected |
|------|--------|----------|
| 1 | Set Dashboard URL to running dashboard. Start session, use a few tabs, stop. | |
| 2 | Open dashboard, refresh | New session appears with correct total_time, effective_time, focus_score, subject_label. |
| 3 | Open Analytics / Performance / Burnout | New session included in charts and burnout. |

---

## 6. Test data reference

Example payloads in `dashboard/test/fixtures/exampleSessions.js`:

- **highFocusSession** + **highFocusTabLogs**: academic-heavy, high effective time, focus 92.
- **lowFocusSession** + **lowFocusTabLogs**: distracting time, focus 38.
- **lateNightSession**: start 23:30 UTC (for burnout late-night).
- **decliningSession1/2/3**: focus 80 → 65 → 45 (declining trend).
- **lowRatioSession**: effective/time &lt; 0.5.
- **minimalSession**: no tab_logs, 1 min, focus 100.
- **mixedCategoriesSession** + **mixedCategoriesTabLogs**: academic, distracting, neutral for doughnut.

Use these for API tests or to extend the seed script.

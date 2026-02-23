# Study Efficiency Tracker – Testing Guide

## How the extension decides what counts as “distracting”

The extension does **not** mark individual tabs with a visible “distraction” label. It classifies every page by **domain + page title** into one of three categories: **academic**, **distracting**, or **neutral**. Only **distracting** sites trigger delays/blocks and hurt your focus score.

### Step 1: Extract the domain

From the tab’s URL, the extension takes the **hostname** (e.g. `www.youtube.com`, `docs.google.com`). Chrome internal pages like `chrome://`, `edge://`, and the extension’s own page are still tracked; their “domain” is just that URL’s host.

### Step 2: Classify the domain (and sometimes the title)

Classification order:

1. **Academic** (never treated as distracting)  
   - Exact matches: `docs.google.com`, `scholar.google.com`, `notion.so`, `www.notion.so`, `coursera.org`, `www.coursera.org`  
   - Any hostname that **starts with** `canvas.` or `blackboard.` (e.g. `canvas.lms.edu`, `blackboard.school.edu`)

2. **Distracting** (unless the YouTube exception below applies)  
   - Instagram: `instagram.com`, `www.instagram.com`  
   - TikTok: `tiktok.com`, `www.tiktok.com`  
   - Reddit: `reddit.com`, `www.reddit.com`  
   - Twitter/X: `twitter.com`, `x.com`, `www.twitter.com`, `www.x.com`  
   - Facebook: `facebook.com`, `www.facebook.com`  
   - YouTube: `youtube.com`, `www.youtube.com`, `m.youtube.com`  

3. **YouTube exception (academic)**  
   - If the domain is one of the YouTube domains above **and** the **page title** contains (case‑insensitive) any of: **lecture**, **tutorial**, **course**, **class**  
   - Then the tab is classified as **academic**, not distracting.  
   - Example: “Biology 101 – Lecture 3” → academic.

4. **Neutral**  
   - Any other domain (e.g. `wikipedia.org`, `stackoverflow.com`, `github.com`, `google.com` for search, news sites, etc.) is **neutral**.  
   - Neutral time is not counted as distracting and does not trigger soft delay or hard block.

### Summary table

| Category    | Effect on score              | Soft delay | Hard block |
|------------|------------------------------|------------|------------|
| Academic   | Not distracting              | No         | No         |
| Neutral    | Not distracting              | No         | No         |
| Distracting| Counts as distracting time   | Yes (if on)| Yes (if on)|

So: **“What tabs does it mark as distraction?”** = any tab whose URL’s hostname is in the distracting list above, unless it’s YouTube and the title looks like a lecture/tutorial/course/class.

---

## How to test all current features

### Prerequisites

- Extension loaded in Chrome (Load unpacked → select the `extension` folder).
- Pin the extension in the toolbar so you can open the popup quickly.

---

### 1. Session start / stop and popup UI

**Goal:** Session only runs when you start it; popup shows status and metrics.

1. Open the extension popup (click the icon).
2. Confirm you see **“No active session”** and **“Mode: Idle”**.
3. Optionally enter a **Subject or Topic Label** (e.g. “Math”).
4. Click **Start Session**.
5. Confirm:
   - Status changes to **“Session active”**.
   - **Start Session** is disabled, **Stop Session** is enabled.
6. Click **Stop Session**.
7. Confirm:
   - Status goes back to **“No active session”**.
8. Start a session again, browse a few tabs for 1–2 minutes, then stop.  
   - After stopping, the popup should show a **Focus Score** and **Effective Time** for that session (they may still be 0 or low if you didn’t hit distracting sites or switch a lot).

**What you’re testing:** Session state, persistence in `chrome.storage.local`, and that tracking only happens when a session is active.

---

### 2. Tab tracking (time per tab, domain, category)

**Goal:** The extension records which tab is active, for how long, and its category (academic / neutral / distracting).

1. Start a session.
2. Open a **neutral** site (e.g. `https://en.wikipedia.org/wiki/Test`). Leave it focused for ~30 seconds.
3. Switch to an **academic** site (e.g. `https://docs.google.com/document/d/anything`). Stay 20–30 seconds.
4. Switch to a **distracting** site (e.g. `https://www.reddit.com` or `https://www.youtube.com` with a normal video title). Stay ~30 seconds.
5. Open the popup and confirm the session is still active.
6. Stop the session.
7. Check:
   - A **Focus Score** and **Effective Time** appear.
   - If you had distracting time and/or tab switches, the score should be below 100 and effective time less than total time.

**What you’re testing:** `chrome.tabs.onActivated` / `onUpdated`, `performance.now()` timing, `extractDomain`, and `classifyDomain` (academic vs neutral vs distracting).

---

### 3. Distraction classification (academic vs distracting vs neutral)

**Goal:** Verify exactly which domains are treated as distracting vs academic vs neutral.

- **Should be distracting (and trigger delay/block if enabled):**
  - `instagram.com`, `tiktok.com`, `reddit.com`, `twitter.com`, `x.com`, `facebook.com`, `youtube.com` (and www/m variants).
- **Should be academic (never distracting):**
  - `docs.google.com`, `scholar.google.com`, `notion.so`, `coursera.org`, any `canvas.*`, `blackboard.*`.
- **YouTube → academic:** Open a YouTube video whose **title** contains “lecture”, “tutorial”, “course”, or “class”. That tab should be classified academic (no delay/block, no distracting time).
- **Neutral:** e.g. `wikipedia.org`, `github.com`, `stackoverflow.com`, `google.com` (search). No delay/block, no distracting time.

Test by starting a session, visiting each type, then stopping and seeing how much the focus score and effective time are affected (distracting time and switches lower the score).

---

### 4. Important tab (star button)

**Goal:** Star marks a tab as “important”; important→important switches don’t add a penalty.

1. Start a session.
2. Open any normal webpage (e.g. Wikipedia).
3. In the bottom‑right you should see a floating **⭐** button. Click it.  
   - It should turn **green** when the tab is marked important.
4. Click again to unmark; it should go back to blue.
5. Open another tab (e.g. another Wikipedia article). Click the star there too (so both are important).
6. Switch back and forth between the two important tabs a few times, then stop the session.  
   - Those switches count as important→important, so they don’t add the same penalty as switching to distracting.

**What you’re testing:** Content script injects the star, `CONTENT_TOGGLE_IMPORTANT` message, `session.importantTabs`, and that important↔important doesn’t add penalized switches.

---

### 5. Soft delay mode (10‑second overlay on distracting sites)

**Goal:** When soft delay is on, opening a distracting site shows a full‑page overlay with a 10‑second countdown, then you can use the page.

1. In the popup, turn **Soft Delay Mode** **ON**. Leave **Hard Block Mode** OFF.
2. Start a session.
3. Open a distracting site (e.g. `https://www.reddit.com` or `https://www.youtube.com` with a non‑academic title).
4. You should see a dark overlay: **“You are in a study session.”** and **“This is a distracting site. Hold on…”** with a **10‑second countdown**.
5. Wait for the countdown to finish; the overlay should disappear and the page become usable.
6. Time on that tab is still counted as distracting for the focus score; the overlay only delays access.

**What you’re testing:** `SHOW_SOFT_DELAY` message from background to content script, overlay UI, and countdown.

---

### 6. Hard block mode (redirect to Deep Study page)

**Goal:** When hard block is on, opening a distracting site redirects the tab to the extension’s “Deep Study” page (no access to the site).

1. In the popup, turn **Hard Block Mode** **ON**. Turn **Soft Delay Mode** OFF (only one mode should be on).
2. Start a session.
3. Open a distracting site (e.g. `https://www.instagram.com` or `https://www.tiktok.com`).
4. The tab should **redirect** to a page that says **“You are in Deep Study Mode.”** and explains the site was blocked.
5. You should **not** see the actual Instagram/TikTok page in that tab.
6. Click **“Exit Study Session”** on the Deep Study page.  
   - The session should end and the tab may go to `about:blank` (or you can navigate away).

**What you’re testing:** `handleDistractingTab` with `hardBlockMode`, `chrome.tabs.update` to `deepstudy.html`, and the exit button ending the session.

---

### 7. Idle detection (no tracking while idle)

**Goal:** After 60 seconds of no mouse/keyboard, the extension stops counting time toward the session; when you come back, idle time is logged but not as “effective” study time.

1. Start a session.
2. Focus an academic or neutral tab (e.g. a Google Doc or Wikipedia).
3. Don’t touch the mouse or keyboard for **at least 60 seconds** (Chrome’s idle threshold).
4. Move the mouse or press a key to become “active” again.
5. Browse a bit more, then stop the session.
6. Check the result:  
   - **Effective time** should be less than **total time** by roughly the idle period (idle time is subtracted in the formula).  
   - You may get a “Study Session Ended” notification when you stop.

**What you’re testing:** `chrome.idle` (60s interval), `idle`/`locked` vs `active`, and that idle time is excluded from effective study time.

---

### 8. Micro‑distractions (< 60 seconds on a distracting site)

**Goal:** Short visits to distracting domains (< 60 seconds) are counted as “micro‑distractions” and reduce the focus score by 2 points each.

1. Start a session.
2. Open a distracting site (e.g. Reddit), stay **less than 60 seconds** (e.g. 20 seconds), then switch to a neutral or academic tab.
3. Repeat once or twice (quick visits to Reddit/YouTube/etc.).
4. Stop the session.
5. Focus score should be reduced by **2 points per** such short distracting visit (on top of any penalty from distracting time and switches).

**What you’re testing:** `prevCategory === "distracting" && durationSeconds < 60` → `microDistractionCount`, and the score formula using `M * 2`.

---

### 9. Focus score and effective time (formula)

**Goal:** Score and effective time match the documented formula.

Roughly:

- **Effective time** = total session time − distracting time − (penalized switches − important↔important switches) × 5 − idle time (capped at 0).
- **Focus score** = 100 − (D/T)×50 − ((S−I)/T)×30 − M×2, then minus 5 per “extra” new domain after the first 5 minutes (context stability), then clamped 0–100.

To test:

- Long stretch on one academic/neutral tab → high score, effective time close to total.
- Lots of distracting time and tab switches → lower score and lower effective time.
- Many quick distracting visits → extra deduction from micro‑distractions (M×2).

---

### 10. Settings persistence (sync)

**Goal:** Soft delay, hard block, and optional Supabase User ID are saved across popup closes and browser restarts.

1. Turn **Soft Delay Mode** ON, enter something in **Supabase User ID**, close the popup.
2. Reopen the popup: Soft Delay should still be ON and the User ID still there.
3. Change to **Hard Block Mode** ON, close and reopen: Hard Block should stay ON.
4. (Optional) Restart Chrome, reopen popup: settings should still be there (they’re in `chrome.storage.sync`).

**What you’re testing:** `chrome.storage.sync` and the popup reading/writing settings via `POPUP_UPDATE_SETTINGS`.

---

### 11. Deep Study page – Exit Study Session

**Goal:** The “Exit Study Session” button on the Deep Study page ends the session and clears state.

1. Turn **Hard Block Mode** ON, start a session.
2. Open a distracting site so you’re redirected to the Deep Study page.
3. Click **“Exit Study Session”**.
4. Session should end (popup should show “No active session” if you open it).
5. New tabs to distracting sites should load normally (no redirect) until you start a new session.

**What you’re testing:** `DEEPSTUDY_EXIT_SESSION` message and `endCurrentSession()`.

---

## Quick reference: what counts as “distracting”

- **Always distracting:** Instagram, TikTok, Reddit, Twitter/X, Facebook, YouTube (unless title has lecture/tutorial/course/class).
- **Never distracting:** Google Docs, Google Scholar, Notion, Coursera, any Canvas/Blackboard hostname, and YouTube with academic‑like titles.
- **Everything else:** Neutral (e.g. Wikipedia, GitHub, Google Search, news sites).

Use the tests above to verify that the extension’s behavior matches this and that all current features (sessions, tab tracking, star, soft delay, hard block, idle, micro‑distractions, score, settings, Deep Study exit) work as described.

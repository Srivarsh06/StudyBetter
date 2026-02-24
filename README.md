# 🧠 studyBetter — Pulse Hackathon 1st Place Winner

Every day, we lose one of our most valuable resources — **attention**.

Students often sit down to study for three hours, but by the end of the session, only a fraction of that time was actually spent learning. The rest is lost to distractions like social media, task-switching, idle time, or constantly jumping between tabs — and the worst part is, we don’t even realize it’s happening.

Unlike electricity or water, there are currently no systems that measure how efficiently we’re using our **cognitive time** while studying.

So we built **studyBetter**.

---

## 🚀 What is studyBetter?

**studyBetter** is a Chrome Extension + Analytics Dashboard that treats focus as a measurable resource — similar to how modern systems monitor CPU utilization or memory usage.

Instead of optimizing how long you study, studyBetter helps optimize **how well** you study.

---

## 📊 Features

When a user starts a study session, our extension begins tracking:

- Active tab usage  
- Time spent on academic vs distracting domains  
- Task-switching behavior  
- Idle periods  
- Micro-distractions (e.g. checking Instagram for 30 seconds)  

Users can also mark **important tabs** (like lecture slides or documentation), allowing the system to distinguish between:

- Productive context switching  
- Disruptive attention loss  

Using this behavioral data, studyBetter calculates a **Focus Score** that reflects how effectively someone used their study time.

So instead of saying:

> "I studied for 3 hours."

Users can now see:

> "I studied for 3 hours, but only 1.9 hours were actually effective."

---

## ⚡ Real-Time Intervention

If a distracting site is opened during an active study session:

### Soft Mode
Introduces a short delay before allowing access, encouraging reflection.

### Hard Mode
Redirects the user to a Deep Study page to help maintain focus.

---

## 📈 Analytics Dashboard

All session data is synced to a web dashboard where users can view:

- Daily and weekly focus trends  
- Effective vs distracting time  
- Productivity heatmaps  
- Task-switching behavior  
- Correlations between effective study time and academic performance  

---

## 🔥 Burnout Detection

studyBetter computes a **Burnout Score** based on:

- Declining focus trends  
- Late-night study sessions  
- Low efficiency ratios  

This helps students recognize when pushing harder may actually be counterproductive.

---

## 🎯 Our Goal

By identifying where attention is being lost and providing measurable feedback, studyBetter helps conserve a critical, invisible resource — **focus** — turning passive study time into intentional, effective work.

## How to use Extension

1. Open `chrome://extensions/` → **Developer mode** → **Load unpacked** → select the `extension` folder.
2. In the popup, set **Dashboard URL** to your dashboard (e.g. `http://localhost:3000` when running locally).
3. Start/stop sessions; when you **Stop Session**, data is POSTed to the dashboard.

## Dashboard (no login)

1. From `dashboard/`: run `npm install` then `npm run dev`.
2. Open [http://localhost:3000](http://localhost:3000). You go straight to the dashboard (no login).
3. Sessions are stored in `dashboard/data/sessions.json`. The extension syncs to `POST /api/sync-session`.

**Note:** File storage works when running locally. On Vercel (or other serverless hosts), the filesystem is not persistent, so data would not survive between requests 

## FUTURE MODIFICATIONS

For this **single-user, no-login test concept**: **no** currently the dashboard uses a local JSON file and does not need Supabase or any external database. But we plan on implementing multi-user/ hosted deployment with persistent data.


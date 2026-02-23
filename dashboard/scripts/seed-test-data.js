/**
 * Seeds data/sessions.json with example sessions for manual testing.
 * Run from dashboard/: node scripts/seed-test-data.js
 * Or: npm run seed
 */
const fs = require("fs");
const path = require("path");
const {
  apiPayloads,
  storedSession,
} = require("../test/fixtures/exampleSessions.js");

const DATA_DIR = path.join(__dirname, "..", "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

const sessions = [];
for (const { session: sessionPayload, tab_logs: tabLogsPayload } of apiPayloads) {
  const id = require("crypto").randomUUID();
  sessions.push(storedSession(id, sessionPayload, tabLogsPayload));
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
console.log("Seeded", sessions.length, "sessions to", SESSIONS_FILE);

/**
 * Example user data for testing all app features.
 * Covers: high/low focus, late night, declining trend, mixed categories, empty/minimal data.
 */

const now = new Date();
const today = now.toISOString();
const yesterday = new Date(now.getTime() - 86400000).toISOString();
const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();
const lateNight = new Date(now);
lateNight.setHours(23, 30, 0, 0);
const lateNightIso = lateNight.toISOString();

/** Session payload as sent by the extension (POST /api/sync-session) */
function apiSession(overrides = {}) {
  return {
    start_time: overrides.start_time ?? today,
    end_time: overrides.end_time ?? today,
    total_time: overrides.total_time ?? 3600,
    effective_time: overrides.effective_time ?? 3000,
    focus_score: overrides.focus_score ?? 85,
    burnout_score: overrides.burnout_score ?? 0,
    subject_label: overrides.subject_label ?? "",
    user_id: overrides.user_id ?? null,
    ...overrides,
  };
}

/** Tab log as in API payload */
function tabLog(overrides = {}) {
  return {
    domain: overrides.domain ?? "example.com",
    category: overrides.category ?? "neutral",
    time_spent: overrides.time_spent ?? 120,
    is_important: overrides.is_important ?? false,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    ...overrides,
  };
}

/** 1. High-focus session: mostly academic, long effective time */
const highFocusSession = apiSession({
  start_time: twoDaysAgo,
  end_time: twoDaysAgo,
  total_time: 3600,
  effective_time: 3200,
  focus_score: 92,
  subject_label: "Linear Algebra",
});
const highFocusTabLogs = [
  tabLog({ domain: "docs.google.com", category: "academic", time_spent: 1800 }),
  tabLog({ domain: "en.wikipedia.org", category: "neutral", time_spent: 600 }),
  tabLog({ domain: "scholar.google.com", category: "academic", time_spent: 800 }),
];

/** 2. Low-focus session: distracting time, switches */
const lowFocusSession = apiSession({
  start_time: yesterday,
  end_time: yesterday,
  total_time: 3600,
  effective_time: 900,
  focus_score: 38,
  subject_label: "Essay",
});
const lowFocusTabLogs = [
  tabLog({ domain: "reddit.com", category: "distracting", time_spent: 1200 }),
  tabLog({ domain: "youtube.com", category: "distracting", time_spent: 900 }),
  tabLog({ domain: "docs.google.com", category: "academic", time_spent: 400 }),
];

/** 3. Late-night session (for burnout) */
const lateNightSession = apiSession({
  start_time: lateNightIso,
  end_time: lateNightIso,
  total_time: 1800,
  effective_time: 1200,
  focus_score: 70,
  subject_label: "Cramming",
});

/** 4. Declining focus trend: last 3 sessions with dropping focus */
const decliningSession1 = apiSession({
  start_time: new Date(now.getTime() - 5 * 86400000).toISOString(),
  total_time: 3600,
  effective_time: 3000,
  focus_score: 80,
});
const decliningSession2 = apiSession({
  start_time: new Date(now.getTime() - 4 * 86400000).toISOString(),
  total_time: 3600,
  effective_time: 2400,
  focus_score: 65,
});
const decliningSession3 = apiSession({
  start_time: new Date(now.getTime() - 3 * 86400000).toISOString(),
  total_time: 3600,
  effective_time: 1500,
  focus_score: 45,
});

/** 5. Low effective ratio session (< 50%) */
const lowRatioSession = apiSession({
  start_time: new Date(now.getTime() - 6 * 86400000).toISOString(),
  total_time: 3600,
  effective_time: 1200,
  focus_score: 35,
});

/** 6. Minimal session (no tab_logs) */
const minimalSession = apiSession({
  start_time: today,
  end_time: today,
  total_time: 60,
  effective_time: 60,
  focus_score: 100,
  subject_label: "Quick review",
});

/** 7. Mixed categories for analytics doughnut */
const mixedCategoriesSession = apiSession({
  start_time: new Date(now.getTime() - 7 * 86400000).toISOString(),
  total_time: 5400,
  effective_time: 3600,
  focus_score: 72,
});
const mixedCategoriesTabLogs = [
  tabLog({ domain: "notion.so", category: "academic", time_spent: 2000 }),
  tabLog({ domain: "instagram.com", category: "distracting", time_spent: 600 }),
  tabLog({ domain: "github.com", category: "neutral", time_spent: 1800 }),
];

/** Full API payloads for sync-session POST */
const apiPayloads = [
  { session: highFocusSession, tab_logs: highFocusTabLogs },
  { session: lowFocusSession, tab_logs: lowFocusTabLogs },
  { session: lateNightSession, tab_logs: [] },
  { session: decliningSession1, tab_logs: [] },
  { session: decliningSession2, tab_logs: [] },
  { session: decliningSession3, tab_logs: [] },
  { session: lowRatioSession, tab_logs: [] },
  { session: minimalSession, tab_logs: [] },
  { session: mixedCategoriesSession, tab_logs: mixedCategoriesTabLogs },
];

/** Stored session shape (after addSession) for seeding JSON */
function storedSession(id, sessionPayload, tabLogsPayload = []) {
  return {
    id,
    start_time: sessionPayload.start_time,
    end_time: sessionPayload.end_time,
    total_time: sessionPayload.total_time ?? 0,
    effective_time: sessionPayload.effective_time ?? 0,
    focus_score: sessionPayload.focus_score ?? 0,
    burnout_score: sessionPayload.burnout_score ?? 0,
    subject_label: sessionPayload.subject_label ?? "",
    tab_logs: (tabLogsPayload || []).map((log) => ({
      domain: log.domain ?? "",
      category: log.category ?? "neutral",
      time_spent: log.time_spent ?? 0,
      is_important: log.is_important ?? false,
      timestamp: log.timestamp ?? new Date().toISOString(),
    })),
  };
}

module.exports = {
  apiSession,
  tabLog,
  highFocusSession,
  highFocusTabLogs,
  lowFocusSession,
  lowFocusTabLogs,
  lateNightSession,
  decliningSession1,
  decliningSession2,
  decliningSession3,
  lowRatioSession,
  minimalSession,
  mixedCategoriesSession,
  mixedCategoriesTabLogs,
  apiPayloads,
  storedSession,
};

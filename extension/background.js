const SESSION_STORAGE_KEY = "study_efficiency_current_session";
const SETTINGS_STORAGE_KEY = "study_efficiency_settings";

const DEFAULT_SETTINGS = {
  softDelayMode: false,
  hardBlockMode: false,
  supabaseUserId: "",
  dashboardBaseUrl: ""
};

const DISTRACTING_DOMAINS = new Set([
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "reddit.com",
  "www.reddit.com",
  "twitter.com",
  "x.com",
  "www.twitter.com",
  "www.x.com",
  "facebook.com",
  "www.facebook.com",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com"
]);

const ACADEMIC_DOMAINS = new Set([
  "docs.google.com",
  "scholar.google.com",
  "notion.so",
  "www.notion.so",
  "coursera.org",
  "www.coursera.org"
]);

const ACADEMIC_WILDCARDS = ["canvas.", "blackboard."];

let session = null;
let settings = { ...DEFAULT_SETTINGS };
let isIdle = false;
let idleStartedAt = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.idle.setDetectionInterval(60);
  loadSettings();
  loadSession();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.idle.setDetectionInterval(60);
  loadSettings();
  loadSession();
});

function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch (e) {
    return "";
  }
}

function classifyDomain(domain, title) {
  if (!domain) {
    return "neutral";
  }
  if (ACADEMIC_DOMAINS.has(domain)) {
    return "academic";
  }
  for (const prefix of ACADEMIC_WILDCARDS) {
    if (domain.startsWith(prefix)) {
      return "academic";
    }
  }
  if (DISTRACTING_DOMAINS.has(domain)) {
    if (
      domain.includes("youtube.com") &&
      title &&
      /\b(lecture|tutorial|course|class)\b/i.test(title)
    ) {
      return "academic";
    }
    return "distracting";
  }
  return "neutral";
}

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(SETTINGS_STORAGE_KEY, (data) => {
      if (data && data[SETTINGS_STORAGE_KEY]) {
        settings = { ...DEFAULT_SETTINGS, ...data[SETTINGS_STORAGE_KEY] };
      } else {
        settings = { ...DEFAULT_SETTINGS };
      }
      resolve(settings);
    });
  });
}

function saveSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      {
        [SETTINGS_STORAGE_KEY]: settings
      },
      () => resolve()
    );
  });
}

async function loadSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(SESSION_STORAGE_KEY, (data) => {
      if (data && data[SESSION_STORAGE_KEY]) {
        session = data[SESSION_STORAGE_KEY];
      } else {
        session = null;
      }
      resolve(session);
    });
  });
}

function persistSession() {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [SESSION_STORAGE_KEY]: session
      },
      () => resolve()
    );
  });
}

function clearSessionStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(SESSION_STORAGE_KEY, () => resolve());
  });
}

function createNewSession() {
  const now = Date.now();
  session = {
    isActive: true,
    startTime: now,
    endTime: null,
    totalTimeSeconds: 0,
    effectiveTimeSeconds: 0,
    totalIdleSeconds: 0,
    totalDistractingSeconds: 0,
    totalSwitches: 0,
    importantImportantSwitches: 0,
    penalizedSwitches: 0,
    microDistractionCount: 0,
    importantTabs: [],
    tabStats: {},
    tabLogs: [],
    lastTabId: null,
    lastTabDomain: null,
    lastTabCategory: null,
    lastTabStartPerf: performance.now(),
    domainsSeen: [],
    domainsAfterFiveMinutes: [],
    subjectLabel: "",
    focusScore: 0,
    burnoutScore: 0,
    youtubeResolvedCategory: {}
  };
}

function isTabImportant(tabId) {
  if (!session) {
    return false;
  }
  return session.importantTabs.includes(tabId);
}

function toggleImportantTab(tabId) {
  if (!session) {
    return;
  }
  const index = session.importantTabs.indexOf(tabId);
  if (index === -1) {
    session.importantTabs.push(tabId);
  } else {
    session.importantTabs.splice(index, 1);
  }
}

function recordTabTime(endPerf, tabId, domain, category) {
  if (!session || session.lastTabId === null || session.lastTabDomain === null) {
    return;
  }
  const durationMs = Math.max(0, endPerf - session.lastTabStartPerf);
  const durationSeconds = durationMs / 1000;
  const prevDomain = session.lastTabDomain;
  const prevCategory = session.lastTabCategory;
  const prevTabId = session.lastTabId;
  const prevResolvedCategory = (session.youtubeResolvedCategory && session.youtubeResolvedCategory[prevTabId] !== undefined)
    ? session.youtubeResolvedCategory[prevTabId]
    : prevCategory;

  if (!session.tabStats[prevDomain]) {
    session.tabStats[prevDomain] = {
      domain: prevDomain,
      totalTimeSeconds: 0,
      distractingTimeSeconds: 0,
      category: prevCategory,
      isImportant: false
    };
  }

  const stat = session.tabStats[prevDomain];
  stat.totalTimeSeconds += durationSeconds;
  if (prevResolvedCategory === "distracting") {
    stat.distractingTimeSeconds += durationSeconds;
    session.totalDistractingSeconds += durationSeconds;
  }
  stat.isImportant = stat.isImportant || isTabImportant(prevTabId);

  session.tabLogs.push({
    tabId: prevTabId,
    domain: prevDomain,
    category: prevResolvedCategory,
    timeSpentSeconds: durationSeconds,
    isImportant: isTabImportant(prevTabId),
    timestamp: new Date().toISOString()
  });

  if (prevResolvedCategory === "distracting" && durationSeconds < 60) {
    session.microDistractionCount += 1;
  }

  if (!session.domainsSeen.includes(prevDomain)) {
    session.domainsSeen.push(prevDomain);
    const elapsedSeconds = (Date.now() - session.startTime) / 1000;
    if (elapsedSeconds > 300 && !session.domainsAfterFiveMinutes.includes(prevDomain)) {
      session.domainsAfterFiveMinutes.push(prevDomain);
    }
  }

  if (domain !== null && tabId !== null) {
    const fromImportant = isTabImportant(prevTabId);
    const toImportant = isTabImportant(tabId);
    const toCategory = category;
    const fromCategory = prevResolvedCategory;

    let penalized = false;
    if (fromCategory === "distracting" && toCategory === "distracting") {
      penalized = true;
    } else if (toCategory === "distracting" && fromCategory !== "distracting") {
      penalized = true;
    } else if (
      fromCategory === "distracting" &&
      toCategory !== "distracting"
    ) {
      penalized = true;
    }

    session.totalSwitches += 1;
    if (fromImportant && toImportant) {
      session.importantImportantSwitches += 1;
    }
    if (penalized) {
      session.penalizedSwitches += 1;
    }
  }
}

function handleTabActivated(activeInfo) {
  if (!session || !session.isActive || isIdle) {
    return;
  }
  const nowPerf = performance.now();
  const newTabId = activeInfo.tabId;
  chrome.tabs.get(newTabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      return;
    }
    const url = tab.url || "";
    const title = tab.title || "";
    const domain = extractDomain(url);
    const category = classifyDomain(domain, title);

    recordTabTime(nowPerf, newTabId, domain, category);

    session.lastTabId = newTabId;
    session.lastTabDomain = domain;
    session.lastTabCategory = category;
    session.lastTabStartPerf = nowPerf;
    persistSession();

    if (category === "distracting" && domain.includes("youtube.com")) {
      chrome.tabs.sendMessage(newTabId, { type: "CHECK_YOUTUBE_ACADEMIC" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          session.youtubeResolvedCategory[newTabId] = "distracting";
          handleDistractingTab(newTabId, domain, category);
          persistSession();
          return;
        }
        if (response.academic) {
          session.youtubeResolvedCategory[newTabId] = "academic";
          session.lastTabCategory = "academic";
          persistSession();
        } else {
          session.youtubeResolvedCategory[newTabId] = "distracting";
          handleDistractingTab(newTabId, domain, category);
          persistSession();
        }
      });
    } else if (category === "distracting") {
      handleDistractingTab(newTabId, domain, category);
    }
  });
}

function handleTabUpdated(tabId, changeInfo, tab) {
  if (!session || !session.isActive || isIdle) {
    return;
  }
  if (changeInfo.status === "complete") {
    const url = tab.url || "";
    const title = tab.title || "";
    const domain = extractDomain(url);
    const category = classifyDomain(domain, title);

    if (tab.active) {
      const nowPerf = performance.now();
      recordTabTime(nowPerf, tabId, domain, category);
      session.lastTabId = tabId;
      session.lastTabDomain = domain;
      session.lastTabCategory = category;
      session.lastTabStartPerf = nowPerf;
      persistSession();
    }

    if (category === "distracting" && domain.includes("youtube.com")) {
      chrome.tabs.sendMessage(tabId, { type: "CHECK_YOUTUBE_ACADEMIC" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          session.youtubeResolvedCategory[tabId] = "distracting";
          handleDistractingTab(tabId, domain, category);
          persistSession();
          return;
        }
        if (response.academic) {
          session.youtubeResolvedCategory[tabId] = "academic";
          session.lastTabCategory = "academic";
          persistSession();
        } else {
          session.youtubeResolvedCategory[tabId] = "distracting";
          handleDistractingTab(tabId, domain, category);
          persistSession();
        }
      });
    } else if (category === "distracting") {
      handleDistractingTab(tabId, domain, category);
    }
  }
}

function handleDistractingTab(tabId, domain, category) {
  if (!session || !session.isActive) {
    return;
  }
  if (settings.hardBlockMode) {
    chrome.tabs.update(tabId, {
      url: chrome.runtime.getURL("deepstudy.html")
    });
  } else if (settings.softDelayMode) {
    chrome.tabs.sendMessage(tabId, {
      type: "SHOW_SOFT_DELAY",
      payload: {
        countdownSeconds: 10
      }
    });
  }
}

chrome.tabs.onActivated.addListener(handleTabActivated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);

chrome.idle.onStateChanged.addListener((newState) => {
  if (!session || !session.isActive) {
    return;
  }
  if (newState === "idle" || newState === "locked") {
    if (!isIdle) {
      isIdle = true;
      idleStartedAt = performance.now();
      recordTabTime(idleStartedAt, null, null, null);
      persistSession();
    }
  } else if (newState === "active") {
    if (isIdle && idleStartedAt !== null) {
      const nowPerf = performance.now();
      const idleDurationSeconds = (nowPerf - idleStartedAt) / 1000;
      session.totalIdleSeconds += idleDurationSeconds;
      isIdle = false;
      idleStartedAt = null;
      session.lastTabStartPerf = nowPerf;
      persistSession();
    }
  }
});

function computeFocusScore(finalSession) {
  const start = finalSession.startTime;
  const end = finalSession.endTime || Date.now();
  const T = Math.max(1, (end - start) / 1000);
  const D = finalSession.totalDistractingSeconds;
  const S = finalSession.penalizedSwitches + finalSession.importantImportantSwitches;
  const I = finalSession.importantImportantSwitches;
  const M = finalSession.microDistractionCount;
  const IDLE = finalSession.totalIdleSeconds;

  let E = T - D - (S - I) * 5 - IDLE;
  if (E < 0) {
    E = 0;
  }
  finalSession.totalTimeSeconds = T;
  finalSession.effectiveTimeSeconds = E;

  let score =
    100 -
    (D / T) * 50 -
    ((S - I) / T) * 30 -
    M * 2;

  const extraDomains = Math.max(0, finalSession.domainsAfterFiveMinutes.length - 5);
  if (extraDomains > 0) {
    score -= extraDomains * 5;
  }

  if (score < 0) {
    score = 0;
  } else if (score > 100) {
    score = 100;
  }

  finalSession.focusScore = score;
}

function computeBurnoutScore(sessionHistory) {
  if (!sessionHistory || sessionHistory.length === 0) {
    return 0;
  }

  let lateNightSessions = 0;
  let decliningFocusTrend = 0;
  let lowEffectiveRatio = 0;

  const sorted = [...sessionHistory].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  sorted.forEach((s) => {
    const start = new Date(s.start_time);
    const hour = start.getHours();
    if (hour >= 22 || hour < 4) {
      lateNightSessions += 1;
    }
  });

  if (sorted.length >= 3) {
    const lastThree = sorted.slice(-3);
    if (
      lastThree[0].focus_score > lastThree[1].focus_score &&
      lastThree[1].focus_score > lastThree[2].focus_score
    ) {
      decliningFocusTrend = 1;
    }
  }

  const ratios = sorted
    .filter((s) => s.total_time > 0)
    .map((s) => s.effective_time / s.total_time);

  if (ratios.length > 0) {
    const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
    if (avgRatio < 0.5) {
      lowEffectiveRatio = 1;
    }
  }

  let burnout =
    lateNightSessions * 10 +
    decliningFocusTrend * 20 +
    lowEffectiveRatio * 30;

  if (burnout < 0) {
    burnout = 0;
  }
  if (burnout > 100) {
    burnout = 100;
  }
  return burnout;
}

async function uploadSessionToDashboard(finalSession) {
  const base = (settings.dashboardBaseUrl || "").trim().replace(/\/$/, "");
  if (!base) {
    return;
  }
  try {
    const apiUrl = `${base}/api/sync-session`;
    const body = {
      session: {
        start_time: new Date(finalSession.startTime).toISOString(),
        end_time: new Date(finalSession.endTime).toISOString(),
        total_time: Math.round(finalSession.totalTimeSeconds),
        effective_time: Math.round(finalSession.effectiveTimeSeconds),
        focus_score: finalSession.focusScore,
        burnout_score: finalSession.burnoutScore,
        subject_label: finalSession.subjectLabel || "",
        user_id: settings.supabaseUserId || null
      },
      tab_logs: finalSession.tabLogs.map((log) => ({
        domain: log.domain,
        category: log.category,
        time_spent: Math.round(log.timeSpentSeconds),
        is_important: log.isImportant,
        timestamp: log.timestamp
      }))
    };

    await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error("Failed to upload session:", error);
  }
}

function showEndSessionNotification(finalSession) {
  const focus = finalSession.focusScore.toFixed(1);
  const effectiveMinutes = (finalSession.effectiveTimeSeconds / 60).toFixed(1);
  chrome.notifications.create({
    type: "basic",
    title: "Study Session Ended",
    message: `Focus Score: ${focus}\nEffective Study Time: ${effectiveMinutes} minutes`
  });
}

async function endCurrentSession() {
  if (!session || !session.isActive) {
    return null;
  }
  recordTabTime(performance.now(), null, null, null);
  session.endTime = Date.now();

  computeFocusScore(session);

  const sessionHistory = [];
  const burnout = computeBurnoutScore(sessionHistory.concat([
    {
      start_time: new Date(session.startTime).toISOString(),
      total_time: session.totalTimeSeconds,
      effective_time: session.effectiveTimeSeconds,
      focus_score: session.focusScore
    }
  ]));

  session.burnoutScore = burnout;

  showEndSessionNotification(session);

  await uploadSessionToDashboard(session);

  const finishedSession = session;
  session = null;
  await clearSessionStorage();
  return finishedSession;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "POPUP_GET_STATE") {
    sendResponse({
      session,
      settings
    });
    return true;
  }

  if (message && message.type === "POPUP_START_SESSION") {
    createNewSession();
    session.subjectLabel = message.payload && message.payload.subjectLabel
      ? message.payload.subjectLabel
      : "";
    persistSession().then(() => {
      sendResponse({ success: true, session });
    });
    return true;
  }

  if (message && message.type === "POPUP_STOP_SESSION") {
    endCurrentSession().then((finishedSession) => {
      sendResponse({ success: true, session: finishedSession });
    });
    return true;
  }

  if (message && message.type === "POPUP_UPDATE_SETTINGS") {
    settings = {
      ...settings,
      ...message.payload
    };
    saveSettings().then(() => {
      sendResponse({ success: true, settings });
    });
    return true;
  }

  if (message && message.type === "CONTENT_TOGGLE_IMPORTANT") {
    if (session && session.isActive && sender && sender.tab) {
      toggleImportantTab(sender.tab.id);
      persistSession().then(() => {
        sendResponse({
          success: true,
          isImportant: isTabImportant(sender.tab.id)
        });
      });
      return true;
    }
  }

  if (message && message.type === "DEEPSTUDY_EXIT_SESSION") {
    endCurrentSession().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  return false;
});


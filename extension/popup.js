const sessionStatus = document.getElementById("session-status");
const sessionStatusText = document.getElementById("session-status-text");
const modePill = document.getElementById("mode-pill");
const metricFocus = document.getElementById("metric-focus");
const metricEffective = document.getElementById("metric-effective");
const startButton = document.getElementById("start-session");
const stopButton = document.getElementById("stop-session");
const softDelayToggle = document.getElementById("soft-delay-toggle");
const hardBlockToggle = document.getElementById("hard-block-toggle");
const subjectInput = document.getElementById("subject-input");
const dashboardUrlInput = document.getElementById("dashboard-url-input");
const openDashboardLink = document.getElementById("open-dashboard-link");

function updateStatusBadge(isActive) {
  if (isActive) {
    sessionStatus.classList.remove("inactive");
    sessionStatusText.textContent = "Session active";
    modePill.textContent = `Mode: Active`;
  } else {
    sessionStatus.classList.add("inactive");
    sessionStatusText.textContent = "No active session";
    modePill.textContent = `Mode: Idle`;
  }
}

function updateButtons(isActive) {
  if (isActive) {
    startButton.disabled = true;
    stopButton.disabled = false;
  } else {
    startButton.disabled = false;
    stopButton.disabled = true;
  }
}

function renderMetrics(session) {
  if (!session || !session.isActive) {
    metricFocus.textContent = "–";
    metricEffective.textContent = "0m";
    return;
  }
  const focus = session.focusScore || 0;
  metricFocus.textContent = focus.toFixed(1);
  const effectiveSeconds = session.effectiveTimeSeconds || 0;
  const minutes = Math.floor(effectiveSeconds / 60);
  metricEffective.textContent = `${minutes}m`;
}

function applySettings(settings) {
  if (!settings) {
    return;
  }
  softDelayToggle.checked = Boolean(settings.softDelayMode);
  hardBlockToggle.checked = Boolean(settings.hardBlockMode);
  if (typeof settings.dashboardBaseUrl === "string") {
    dashboardUrlInput.value = settings.dashboardBaseUrl;
  }
  const base = (settings.dashboardBaseUrl || "").trim().replace(/\/$/, "");
  openDashboardLink.href = base || "#";
}

function refreshState() {
  chrome.runtime.sendMessage(
    {
      type: "POPUP_GET_STATE"
    },
    (response) => {
      if (!response) {
        return;
      }
      const currentSession = response.session;
      const currentSettings = response.settings;
      updateStatusBadge(Boolean(currentSession && currentSession.isActive));
      updateButtons(Boolean(currentSession && currentSession.isActive));
      renderMetrics(currentSession);
      applySettings(currentSettings);
    }
  );
}

startButton.addEventListener("click", () => {
  const subjectLabel = subjectInput.value.trim();
  chrome.runtime.sendMessage(
    {
      type: "POPUP_START_SESSION",
      payload: {
        subjectLabel
      }
    },
    (response) => {
      if (response && response.success) {
        updateStatusBadge(true);
        updateButtons(true);
      }
    }
  );
});

stopButton.addEventListener("click", () => {
  chrome.runtime.sendMessage(
    {
      type: "POPUP_STOP_SESSION"
    },
    (response) => {
      if (response && response.success) {
        updateStatusBadge(false);
        updateButtons(false);
        renderMetrics(response.session || null);
      }
    }
  );
});

function pushSettingsUpdate() {
  const payload = {
    softDelayMode: softDelayToggle.checked,
    hardBlockMode: hardBlockToggle.checked,
    dashboardBaseUrl: dashboardUrlInput.value.trim().replace(/\/$/, "")
  };
  chrome.runtime.sendMessage(
    {
      type: "POPUP_UPDATE_SETTINGS",
      payload
    },
    () => {}
  );
}

softDelayToggle.addEventListener("change", () => {
  if (softDelayToggle.checked && hardBlockToggle.checked) {
    hardBlockToggle.checked = false;
  }
  pushSettingsUpdate();
});

hardBlockToggle.addEventListener("change", () => {
  if (hardBlockToggle.checked && softDelayToggle.checked) {
    softDelayToggle.checked = false;
  }
  pushSettingsUpdate();
});

dashboardUrlInput.addEventListener("blur", () => {
  pushSettingsUpdate();
  const base = dashboardUrlInput.value.trim().replace(/\/$/, "");
  openDashboardLink.href = base || "#";
});

document.addEventListener("DOMContentLoaded", () => {
  refreshState();
});


(() => {
  let starButton = null;
  let overlay = null;
  let overlayCountdownInterval = null;

  function createStarButton() {
    if (starButton) {
      return;
    }
    starButton = document.createElement("button");
    starButton.textContent = "⭐";
    starButton.style.position = "fixed";
    starButton.style.bottom = "16px";
    starButton.style.right = "16px";
    starButton.style.width = "40px";
    starButton.style.height = "40px";
    starButton.style.borderRadius = "50%";
    starButton.style.border = "none";
    starButton.style.backgroundColor = "#1d4ed8";
    starButton.style.color = "#ffffff";
    starButton.style.fontSize = "20px";
    starButton.style.cursor = "pointer";
    starButton.style.zIndex = "2147483647";
    starButton.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
    starButton.style.display = "flex";
    starButton.style.alignItems = "center";
    starButton.style.justifyContent = "center";

    starButton.addEventListener("click", () => {
      chrome.runtime.sendMessage(
        {
          type: "CONTENT_TOGGLE_IMPORTANT"
        },
        (response) => {
          if (response && response.isImportant) {
            starButton.style.backgroundColor = "#16a34a";
          } else {
            starButton.style.backgroundColor = "#1d4ed8";
          }
        }
      );
    });

    document.documentElement.appendChild(starButton);
  }

  function removeStarButton() {
    if (starButton && starButton.parentNode) {
      starButton.parentNode.removeChild(starButton);
    }
    starButton = null;
  }

  function createOverlay(message, countdownSeconds) {
    if (overlay) {
      removeOverlay();
    }
    overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
    overlay.style.color = "#e5e7eb";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "2147483646";
    overlay.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

    const title = document.createElement("h1");
    title.textContent = "You are in a study session.";
    title.style.fontSize = "28px";
    title.style.fontWeight = "700";
    title.style.marginBottom = "16px";

    const msg = document.createElement("p");
    msg.textContent = message;
    msg.style.fontSize = "18px";
    msg.style.marginBottom = "24px";

    const countdownEl = document.createElement("div");
    countdownEl.style.fontSize = "40px";
    countdownEl.style.fontWeight = "700";
    countdownEl.style.color = "#facc15";
    countdownEl.textContent = String(countdownSeconds);

    overlay.appendChild(title);
    overlay.appendChild(msg);
    overlay.appendChild(countdownEl);

    document.documentElement.appendChild(overlay);

    let remaining = countdownSeconds;
    overlayCountdownInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(overlayCountdownInterval);
        overlayCountdownInterval = null;
        removeOverlay();
      } else {
        countdownEl.textContent = String(remaining);
      }
    }, 1000);
  }

  function removeOverlay() {
    if (overlayCountdownInterval) {
      clearInterval(overlayCountdownInterval);
      overlayCountdownInterval = null;
    }
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    overlay = null;
  }

  function isYouTubePage() {
    try {
      return /^https?:\/\/(www\.|m\.)?youtube\.com\//.test(window.location.href);
    } catch (e) {
      return false;
    }
  }

  const STEM_ACADEMIC_KEYWORDS = [
    "lecture", "lectures", "tutorial", "tutorials", "course", "courses", "class", "classes",
    "lesson", "lessons", "education", "educational", "learn", "learning", "study", "studying",
    "physics", "math", "mathematics", "calculus", "algebra", "geometry", "statistics",
    "chemistry", "organic chemistry", "biology", "anatomy", "physiology", "medicine", "medical",
    "programming", "coding", "computer science", "cs ", "software engineering", "algorithm", "algorithms",
    "engineering", "electrical", "mechanical", "stem", "science", "economics", "finance", "accounting",
    "exam", "exams", "review", "homework", "assignment", "textbook", "professor", "instructor",
    "mit ", "mit opencourseware", "khan academy", "edx", "coursera", "udemy course", "crash course",
    "introduction to", "fundamentals of", "basics of", "explained", "how it works",
    "differentiation", "integration", "linear algebra", "differential equations", "probability"
  ];

  function getTextFromSelector(selector) {
    try {
      const el = document.querySelector(selector);
      return el ? (el.textContent || "").trim() : "";
    } catch (e) {
      return "";
    }
  }

  function getTextFromSelectors(selectors) {
    let text = "";
    for (const sel of selectors) {
      text += getTextFromSelector(sel) + " ";
    }
    return text.trim();
  }

  function gatherYouTubePageText() {
    const parts = [];
    const titleSelectors = [
      "h1.ytd-watch-metadata",
      "#title h1",
      "ytd-video-primary-info-renderer h1",
      "ytd-watch-metadata h1",
      "#info-contents h1",
      ".title yt-formatted-string"
    ];
    parts.push(getTextFromSelectors(titleSelectors));

    const descSelectors = [
      "#description-inline-expander",
      "#description",
      "ytd-text-inline-expander #content",
      "ytd-expandable-video-description-body-renderer #content",
      "#description-inline-expander yt-formatted-string",
      "#info-contents #description"
    ];
    parts.push(getTextFromSelectors(descSelectors));

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.getAttribute("content")) {
      parts.push(metaDesc.getAttribute("content"));
    }

    const secondarySelectors = [
      "ytd-video-secondary-info-renderer",
      "#info-contents ytd-video-secondary-info-renderer"
    ];
    parts.push(getTextFromSelectors(secondarySelectors));

    const channelSelectors = [
      "ytd-channel-name a",
      "#owner-name a",
      "#channel-name a"
    ];
    parts.push(getTextFromSelectors(channelSelectors));

    return parts.join(" ").toLowerCase();
  }

  function checkYouTubeAcademic() {
    if (!isYouTubePage()) {
      return false;
    }
    const text = gatherYouTubePageText();
    if (!text) {
      return false;
    }
    for (const keyword of STEM_ACADEMIC_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "SHOW_SOFT_DELAY") {
      const countdownSeconds = message.payload && message.payload.countdownSeconds
        ? message.payload.countdownSeconds
        : 10;
      createOverlay("This is a distracting site. Hold on for a moment before continuing.", countdownSeconds);
      return;
    }
    if (message && message.type === "CHECK_YOUTUBE_ACADEMIC") {
      function respond() {
        const academic = checkYouTubeAcademic();
        sendResponse({ academic });
      }
      const text = gatherYouTubePageText();
      if (text.length > 20) {
        respond();
      } else {
        setTimeout(respond, 2500);
      }
      return true;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      createStarButton();
    });
  } else {
    createStarButton();
  }

  window.addEventListener("beforeunload", () => {
    removeStarButton();
    removeOverlay();
  });
})();


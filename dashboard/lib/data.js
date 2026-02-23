import fs from "fs/promises";
import path from "path";

function getSessionsFile() {
  return (
    process.env.SESSIONS_FILE_OVERRIDE ||
    path.join(process.cwd(), "data", "sessions.json")
  );
}

async function ensureDataDir(filePath) {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

export async function getSessions() {
  const sessionsFile = getSessionsFile();
  await ensureDataDir(sessionsFile);
  try {
    const raw = await fs.readFile(sessionsFile, "utf-8");
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : data.sessions ?? [];
    return list.sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

export async function addSession(sessionPayload, tabLogsPayload = []) {
  const sessionsFile = getSessionsFile();
  await ensureDataDir(sessionsFile);
  const list = await getSessions();
  const id = crypto.randomUUID();
  const session = {
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
  list.unshift(session);
  await fs.writeFile(sessionsFile, JSON.stringify(list, null, 2), "utf-8");
  return id;
}

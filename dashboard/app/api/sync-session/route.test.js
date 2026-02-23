import fs from "fs/promises";
import path from "path";
import os from "os";
import { POST } from "./route";
import { getSessions } from "@/lib/data";

const originalEnv = process.env.SESSIONS_FILE_OVERRIDE;

describe("POST /api/sync-session", () => {
  let testFile;

  beforeEach(async () => {
    testFile = path.join(os.tmpdir(), `sync-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    process.env.SESSIONS_FILE_OVERRIDE = testFile;
  });

  afterEach(async () => {
    process.env.SESSIONS_FILE_OVERRIDE = originalEnv;
    try {
      await fs.unlink(testFile);
    } catch (e) {
      // ignore
    }
  });

  it("returns 400 when session or start_time/end_time missing", async () => {
    const req1 = new Request("http://localhost/api/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(400);
    const data1 = await res1.json();
    expect(data1.error).toMatch(/missing|start_time|end_time/i);

    const req2 = new Request("http://localhost/api/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: { start_time: "2025-02-22T10:00:00Z" } }),
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(400);
  });

  it("returns 200 and stores session and tab_logs", async () => {
    const body = {
      session: {
        start_time: "2025-02-22T09:00:00Z",
        end_time: "2025-02-22T10:00:00Z",
        total_time: 3600,
        effective_time: 3000,
        focus_score: 88,
        subject_label: "Physics",
      },
      tab_logs: [
        { domain: "docs.google.com", category: "academic", time_spent: 1800, is_important: false, timestamp: "2025-02-22T09:30:00Z" },
      ],
    };
    const req = new Request("http://localhost/api/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.session_id).toBeDefined();

    const sessions = await getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].focus_score).toBe(88);
    expect(sessions[0].subject_label).toBe("Physics");
    expect(sessions[0].tab_logs).toHaveLength(1);
    expect(sessions[0].tab_logs[0].domain).toBe("docs.google.com");
  });

  it("accepts minimal session (only start_time, end_time)", async () => {
    const req = new Request("http://localhost/api/sync-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session: { start_time: "2025-02-22T09:00:00Z", end_time: "2025-02-22T09:05:00Z" },
        tab_logs: [],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const sessions = await getSessions();
    expect(sessions[0].total_time).toBe(0);
    expect(sessions[0].tab_logs).toEqual([]);
  });
});

import fs from "fs/promises";
import path from "path";
import os from "os";
import { getSessions, addSession } from "./data";

const originalEnv = process.env.SESSIONS_FILE_OVERRIDE;

describe("data layer", () => {
  let testFile;

  beforeEach(async () => {
    testFile = path.join(os.tmpdir(), `sessions-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
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

  describe("getSessions", () => {
    it("returns empty array when file does not exist", async () => {
      const sessions = await getSessions();
      expect(sessions).toEqual([]);
    });

    it("returns and sorts sessions by start_time desc", async () => {
      await fs.writeFile(
        testFile,
        JSON.stringify([
          { id: "1", start_time: "2025-02-20T10:00:00Z" },
          { id: "2", start_time: "2025-02-22T10:00:00Z" },
          { id: "3", start_time: "2025-02-21T10:00:00Z" },
        ]),
        "utf-8"
      );
      const sessions = await getSessions();
      expect(sessions.map((s) => s.id)).toEqual(["2", "3", "1"]);
    });

    it("handles data.sessions wrapper format", async () => {
      await fs.writeFile(
        testFile,
        JSON.stringify({ sessions: [{ id: "a", start_time: "2025-02-20T10:00:00Z" }] }),
        "utf-8"
      );
      const sessions = await getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe("a");
    });
  });

  describe("addSession", () => {
    it("creates session with id and embedded tab_logs", async () => {
      const payload = {
        start_time: "2025-02-22T09:00:00Z",
        end_time: "2025-02-22T10:00:00Z",
        total_time: 3600,
        effective_time: 3000,
        focus_score: 85,
        burnout_score: 0,
        subject_label: "Math",
      };
      const tabLogs = [
        { domain: "docs.google.com", category: "academic", time_spent: 1800, is_important: true, timestamp: "2025-02-22T09:30:00Z" },
      ];
      const id = await addSession(payload, tabLogs);
      expect(id).toBeDefined();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(10);

      const sessions = await getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(id);
      expect(sessions[0].start_time).toBe(payload.start_time);
      expect(sessions[0].focus_score).toBe(85);
      expect(sessions[0].tab_logs).toHaveLength(1);
      expect(sessions[0].tab_logs[0].domain).toBe("docs.google.com");
      expect(sessions[0].tab_logs[0].category).toBe("academic");
    });

    it("defaults missing session fields", async () => {
      const payload = { start_time: "2025-02-22T09:00:00Z", end_time: "2025-02-22T10:00:00Z" };
      await addSession(payload, []);
      const sessions = await getSessions();
      expect(sessions[0].total_time).toBe(0);
      expect(sessions[0].effective_time).toBe(0);
      expect(sessions[0].focus_score).toBe(0);
      expect(sessions[0].subject_label).toBe("");
      expect(sessions[0].tab_logs).toEqual([]);
    });

    it("appends new session at start (newest first after sort)", async () => {
      await addSession(
        { start_time: "2025-02-20T10:00:00Z", end_time: "2025-02-20T11:00:00Z" },
        []
      );
      await addSession(
        { start_time: "2025-02-22T10:00:00Z", end_time: "2025-02-22T11:00:00Z" },
        []
      );
      const sessions = await getSessions();
      expect(sessions).toHaveLength(2);
      expect(new Date(sessions[0].start_time).getTime()).toBeGreaterThan(
        new Date(sessions[1].start_time).getTime()
      );
    });
  });
});

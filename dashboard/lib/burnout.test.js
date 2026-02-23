import { computeBurnoutScore } from "./burnout";

describe("computeBurnoutScore", () => {
  const session = (overrides) => ({
    start_time: new Date().toISOString(),
    total_time: 3600,
    effective_time: 2400,
    focus_score: 70,
    ...overrides,
  });

  it("returns 0 for empty sessions", () => {
    expect(computeBurnoutScore([])).toBe(0);
    expect(computeBurnoutScore(null)).toBe(0);
  });

  it("returns 0 when no risk factors", () => {
    const sessions = [
      session({ start_time: "2025-02-20T14:00:00Z" }),
      session({ start_time: "2025-02-21T15:00:00Z" }),
    ];
    expect(computeBurnoutScore(sessions)).toBe(0);
  });

  it("adds 10 per late-night session (22:00–04:00)", () => {
    const sessions = [
      session({ start_time: "2025-02-20T23:30:00Z" }),
    ];
    expect(computeBurnoutScore(sessions)).toBe(10);
  });

  it("adds 20 for declining focus trend (last 3 sessions)", () => {
    const sessions = [
      session({ start_time: "2025-02-18T10:00:00Z", focus_score: 80 }),
      session({ start_time: "2025-02-19T10:00:00Z", focus_score: 65 }),
      session({ start_time: "2025-02-20T10:00:00Z", focus_score: 50 }),
    ];
    expect(computeBurnoutScore(sessions)).toBe(20);
  });

  it("adds 30 for low effective ratio (avg < 0.5)", () => {
    const sessions = [
      session({ start_time: "2025-02-20T14:00:00Z", total_time: 3600, effective_time: 1000 }),
      session({ start_time: "2025-02-21T14:00:00Z", total_time: 3600, effective_time: 1000 }),
    ];
    expect(computeBurnoutScore(sessions)).toBe(30);
  });

  it("combines all factors and clamps to 100", () => {
    const sessions = [
      session({ start_time: "2025-02-18T23:00:00Z", total_time: 3600, effective_time: 1000 }),
      session({ start_time: "2025-02-19T23:00:00Z", total_time: 3600, effective_time: 1000 }),
      session({ start_time: "2025-02-20T10:00:00Z", focus_score: 80, total_time: 3600, effective_time: 1000 }),
      session({ start_time: "2025-02-21T10:00:00Z", focus_score: 60, total_time: 3600, effective_time: 1000 }),
      session({ start_time: "2025-02-22T10:00:00Z", focus_score: 40, total_time: 3600, effective_time: 1000 }),
    ];
    const score = computeBurnoutScore(sessions);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(10 + 10 + 20 + 30);
  });
});

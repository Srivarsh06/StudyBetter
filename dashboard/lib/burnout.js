/**
 * Burnout score: (late_night * 10) + (declining_focus_trend * 20) + (low_effective_ratio * 30)
 * Clamped 0–100.
 */
export function computeBurnoutScore(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  let lateNightSessions = 0;
  let decliningFocusTrend = 0;
  let lowEffectiveRatio = 0;

  sorted.forEach((s) => {
    const hour = new Date(s.start_time).getUTCHours();
    if (hour >= 22 || hour < 4) lateNightSessions += 1;
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
    .map((s) => (s.effective_time || 0) / s.total_time);
  if (ratios.length > 0) {
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (avgRatio < 0.5) lowEffectiveRatio = 1;
  }

  return Math.min(
    100,
    Math.max(
      0,
      lateNightSessions * 10 + decliningFocusTrend * 20 + lowEffectiveRatio * 30
    )
  );
}

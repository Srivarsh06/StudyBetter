import { getSessions } from "@/lib/data";
import { computeBurnoutScore } from "@/lib/burnout";
import BurnoutContent from "./BurnoutContent";

export default async function BurnoutPage() {
  const sessions = await getSessions();
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

  const burnoutScore = computeBurnoutScore(sessions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Burnout</h1>
        <p className="mt-1 text-slate-600">Signals and risk based on your sessions</p>
      </div>

      <BurnoutContent
        burnoutScore={burnoutScore}
        lateNightSessions={lateNightSessions}
        decliningFocusTrend={decliningFocusTrend}
        lowEffectiveRatio={lowEffectiveRatio}
      />
    </div>
  );
}

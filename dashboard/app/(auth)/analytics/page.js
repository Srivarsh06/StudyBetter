import { getSessions } from "@/lib/data";
import AnalyticsCharts from "./AnalyticsCharts";

export default async function AnalyticsPage() {
  const sessionsDesc = await getSessions();
  const sessions = [...sessionsDesc].reverse();

  const categoryTotals = { academic: 0, distracting: 0, neutral: 0 };
  sessions.forEach((s) => {
    (s.tab_logs || []).forEach((log) => {
      if (log.category in categoryTotals) {
        categoryTotals[log.category] += log.time_spent || 0;
      }
    });
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-slate-600">Time and focus across sessions</p>
      </div>

      <AnalyticsCharts sessions={sessions} categoryTotals={categoryTotals} />
    </div>
  );
}

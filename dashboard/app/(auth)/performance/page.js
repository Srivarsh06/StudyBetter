import { getSessions } from "@/lib/data";
import PerformanceCharts from "./PerformanceCharts";

export default async function PerformancePage() {
  const sessionsDesc = await getSessions();
  const sessions = [...sessionsDesc].reverse();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Performance</h1>
        <p className="mt-1 text-slate-600">Focus score and effective ratio over time</p>
      </div>

      <PerformanceCharts sessions={sessions} />
    </div>
  );
}

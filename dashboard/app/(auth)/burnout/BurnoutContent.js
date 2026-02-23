"use client";

export default function BurnoutContent({
  burnoutScore,
  lateNightSessions,
  decliningFocusTrend,
  lowEffectiveRatio,
}) {
  const showWarning = burnoutScore > 60;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border p-6 shadow-sm ${
          showWarning
            ? "border-amber-300 bg-amber-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <h2 className="text-lg font-semibold text-slate-900">Burnout score</h2>
        <p className="mt-2 text-3xl font-bold text-slate-900">{burnoutScore.toFixed(0)}</p>
        <p className="mt-1 text-sm text-slate-600">
          Formula: (late‑night sessions × 10) + (declining focus trend × 20) + (low effective ratio ×
          30)
        </p>
        {showWarning && (
          <div className="mt-4 rounded-lg border border-amber-400 bg-amber-100 p-4 text-amber-900">
            <strong>You may be experiencing burnout.</strong> Consider taking a rest day.
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Late‑night sessions</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{lateNightSessions}</p>
          <p className="mt-1 text-xs text-slate-500">Sessions started 10pm–4am (+10 each)</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Declining focus trend</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {decliningFocusTrend ? "Yes" : "No"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Last 3 sessions focus dropping (+20)</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Low effective ratio</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {lowEffectiveRatio ? "Yes" : "No"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Avg effective/total &lt; 50% (+30)</p>
        </div>
      </div>
    </div>
  );
}

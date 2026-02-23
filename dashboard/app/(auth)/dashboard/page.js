import { getSessions } from "@/lib/data";

export default async function DashboardPage() {
  const sessions = await getSessions();
  const recent = sessions.slice(0, 10);

  const totalEffective = recent.reduce((acc, s) => acc + (s.effective_time || 0), 0);
  const avgFocus =
    recent.length > 0
      ? recent.reduce((acc, s) => acc + (s.focus_score ?? 0), 0) / recent.length
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Your study sessions (single-user test app)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Sessions (last 10)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{recent.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total effective time</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {Math.round(totalEffective / 60)} min
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Avg focus score</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {avgFocus != null ? avgFocus.toFixed(1) : "–"}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Recent sessions</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Start
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Subject
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">
                  Effective
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">
                  Focus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No sessions yet. Set the Dashboard URL in the extension and end a session to sync.
                  </td>
                </tr>
              ) : (
                recent.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {new Date(s.start_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {s.subject_label || "–"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">
                      {Math.round((s.total_time || 0) / 60)} m
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-600">
                      {Math.round((s.effective_time || 0) / 60)} m
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-slate-900">
                      {(s.focus_score ?? 0).toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <strong>Extension sync:</strong> In the extension popup, set Dashboard URL to this app (e.g.
        http://localhost:3000). End a session in the extension to sync data here. No login needed.
      </div>
    </div>
  );
}

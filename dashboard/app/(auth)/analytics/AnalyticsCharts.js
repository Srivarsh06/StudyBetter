"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const optionsBar = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true },
  },
};

const optionsLine = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { min: 0, max: 100 },
  },
};

const optionsDoughnut = {
  responsive: true,
  plugins: {
    legend: { position: "bottom" },
  },
};

export default function AnalyticsCharts({ sessions, categoryTotals }) {
  const labels = (sessions ?? []).slice(-14).map((s) => {
    const d = new Date(s.start_time);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });
  const effectiveMinutes = (sessions ?? []).slice(-14).map((s) =>
    Math.round((s.effective_time || 0) / 60)
  );
  const focusScores = (sessions ?? []).slice(-14).map((s) => s.focus_score ?? 0);

  const barData = {
    labels,
    datasets: [
      {
        label: "Effective time (min)",
        data: effectiveMinutes,
        backgroundColor: "rgba(99, 102, 241, 0.7)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: "Focus score",
        data: focusScores,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const totalCat =
    categoryTotals.academic + categoryTotals.distracting + categoryTotals.neutral;
  const doughnutData = {
    labels: ["Academic", "Distracting", "Neutral"],
    datasets: [
      {
        data: [
          categoryTotals.academic,
          categoryTotals.distracting,
          categoryTotals.neutral,
        ].map((v) => (totalCat > 0 ? Math.round((v / totalCat) * 100) : 0)),
        backgroundColor: ["#22c55e", "#ef4444", "#94a3b8"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Effective study time (last 14)</h2>
        <div className="mt-4 h-64">
          <Bar data={barData} options={optionsBar} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Focus score (last 14)</h2>
        <div className="mt-4 h-64">
          <Line data={lineData} options={optionsLine} />
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-semibold text-slate-900">Time by category (%)</h2>
        <div className="mx-auto mt-4 h-64 w-64">
          <Doughnut data={doughnutData} options={optionsDoughnut} />
        </div>
      </div>
    </div>
  );
}

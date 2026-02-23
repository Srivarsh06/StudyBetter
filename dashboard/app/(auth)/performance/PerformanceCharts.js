"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const options = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
  },
  scales: {
    y: { min: 0, max: 100 },
  },
};

export default function PerformanceCharts({ sessions }) {
  const labels = (sessions ?? []).slice(-21).map((s) => {
    const d = new Date(s.start_time);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  });
  const focusScores = (sessions ?? []).slice(-21).map((s) => s.focus_score ?? 0);
  const ratios = (sessions ?? []).slice(-21).map((s) => {
    const total = s.total_time || 1;
    return Math.round(((s.effective_time || 0) / total) * 100);
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Focus score",
        data: focusScores,
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Effective ratio (%)",
        data: ratios,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Last 21 sessions</h2>
      <div className="mt-4 h-80">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

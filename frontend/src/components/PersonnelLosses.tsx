import ReactECharts from "echarts-for-react";
import type { WeeklyData } from "../types";
import { C } from "../chartTheme";

interface Props {
  data: WeeklyData[];
}

export default function PersonnelLosses({ data }: Props) {
  const hasPersonnel = data.some((d) => (d.personnel_losses ?? 0) > 0);
  if (!data.length || !hasPersonnel) return null;

  const weeks = data.map((d) => d.week_start);
  const losses = data.map((d) => d.personnel_losses ?? 0);

  // 4-week rolling average
  const rollingAvg = losses.map((_, i) => {
    if (i < 3) return null;
    const slice = losses.slice(i - 3, i + 1);
    return Math.round(slice.reduce((a, b) => a + b, 0) / 4);
  });

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: { name: string; value: number; seriesName: string }[]) => {
        const week = params[0]?.name ?? "";
        const bar = params.find((p) => p.seriesName === "Weekly Losses")?.value ?? 0;
        const avg = params.find((p) => p.seriesName === "4-week Avg")?.value;
        return `
          <div style="font-size:11px;color:#64748b;margin-bottom:4px">Week of ${week}</div>
          <div>⚔️ Losses: <strong style="color:#f1f5f9">${bar.toLocaleString()}</strong></div>
          ${avg != null ? `<div>📊 4-wk avg: <strong style="color:#f1f5f9">${avg.toLocaleString()}</strong></div>` : ""}
        `;
      },
    },
    legend: {
      top: 8,
      right: 16,
      textStyle: { color: C.text, fontSize: 12 },
    },
    grid: { left: 68, right: 20, top: 52, bottom: 64, containLabel: false },
    xAxis: {
      type: "category",
      data: weeks,
      ...C.axisStyle,
      axisLabel: {
        ...C.axisStyle.axisLabel,
        formatter: (v: string) => v.slice(0, 7),
        interval: Math.floor(weeks.length / 10),
        rotate: 30,
      },
    },
    yAxis: {
      type: "value",
      name: "Personnel",
      nameTextStyle: { color: C.label, fontSize: 11 },
      ...C.axisStyle,
    },
    dataZoom: [{ type: "inside", start: 0, end: 100 }],
    series: [
      {
        name: "Weekly Losses",
        type: "bar",
        data: losses,
        itemStyle: { color: C.personnel, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 8,
      },
      {
        name: "4-week Avg",
        type: "line",
        data: rollingAvg,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: "#fcd34d", width: 2.5 },
        z: 3,
      },
    ],
  };

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Russian Personnel Losses</h2>
      <p className="text-brand-text text-sm mb-4">
        Weekly reported Russian personnel casualties with 4-week rolling average.
      </p>
      <ReactECharts option={option} style={{ height: 340 }} notMerge />
    </section>
  );
}

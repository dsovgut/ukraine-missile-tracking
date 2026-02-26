import ReactECharts from "echarts-for-react";
import type { DailyData } from "../types";
import { C } from "../chartTheme";

interface Props {
  data: DailyData[];
}

export default function CumulativeChart({ data }: Props) {
  if (!data.length) return null;

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  let cumLaunched = 0;
  let cumDestroyed = 0;
  const dates: string[] = [];
  const seriesLaunched: number[] = [];
  const seriesDestroyed: number[] = [];
  const seriesGotThrough: number[] = [];

  for (const d of sorted) {
    cumLaunched += d.launched;
    cumDestroyed += d.destroyed;
    dates.push(d.date);
    seriesLaunched.push(cumLaunched);
    seriesDestroyed.push(cumDestroyed);
    seriesGotThrough.push(cumLaunched - cumDestroyed);
  }

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      formatter: (params: { name: string; value: number; seriesName: string }[]) => {
        const date = params[0]?.name ?? "";
        const launched = params.find((p) => p.seriesName === "Total Launched")?.value ?? 0;
        const intercepted = params.find((p) => p.seriesName === "Total Intercepted")?.value ?? 0;
        const gotThrough = params.find((p) => p.seriesName === "Got Through")?.value ?? 0;
        return `
          <div style="font-size:11px;color:#64748b;margin-bottom:4px">${date}</div>
          <div style="margin-bottom:2px">🚀 Launched: <strong style="color:${C.launched}">${launched.toLocaleString()}</strong></div>
          <div style="margin-bottom:2px">🛡 Intercepted: <strong style="color:${C.destroyed}">${intercepted.toLocaleString()}</strong></div>
          <div>💥 Got through: <strong style="color:#737373">${gotThrough.toLocaleString()}</strong></div>
        `;
      },
    },
    legend: {
      data: ["Total Launched", "Total Intercepted", "Got Through"],
      textStyle: { color: C.label, fontSize: 11 },
      top: 4,
      right: 8,
    },
    grid: { top: 40, right: 16, bottom: 48, left: 60 },
    xAxis: {
      type: "category",
      data: dates,
      ...C.axisStyle,
      axisLabel: { ...C.axisStyle.axisLabel, rotate: 0 },
    },
    yAxis: {
      type: "value",
      ...C.axisStyle,
      axisLabel: {
        ...C.axisStyle.axisLabel,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
      },
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      {
        type: "slider",
        bottom: 4,
        height: 22,
        borderColor: C.axis,
        fillerColor: "rgba(239,68,68,0.12)",
        handleStyle: { color: C.launched, borderColor: C.launched },
        textStyle: { color: C.label },
        dataBackground: {
          lineStyle: { color: C.axis },
          areaStyle: { color: "#1e293b" },
        },
      },
    ],
    series: [
      {
        name: "Got Through",
        type: "line",
        data: seriesGotThrough,
        showSymbol: false,
        lineStyle: { color: C.text, width: 1 },
        areaStyle: { color: "rgba(115,115,115,0.08)" },
        z: 1,
      },
      {
        name: "Total Intercepted",
        type: "line",
        data: seriesDestroyed,
        showSymbol: false,
        smooth: false,
        lineStyle: { color: C.destroyed, width: 2 },
        areaStyle: { color: "rgba(34,197,94,0.10)" },
        z: 2,
      },
      {
        name: "Total Launched",
        type: "line",
        data: seriesLaunched,
        showSymbol: false,
        smooth: false,
        lineStyle: { color: C.launched, width: 2 },
        areaStyle: { color: "rgba(239,68,68,0.08)" },
        z: 3,
      },
    ],
  };

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Cumulative Scale</h2>
      <p className="text-brand-text text-sm mb-4">
        Running total of every missile and drone fired at Ukraine — launched (red) vs intercepted (green).
        The gap is what got through.
      </p>
      <ReactECharts option={option} style={{ height: 380 }} notMerge />
    </section>
  );
}

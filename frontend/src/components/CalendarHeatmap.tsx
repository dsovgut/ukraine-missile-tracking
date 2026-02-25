import ReactECharts from "echarts-for-react";
import type { DailyData } from "../types";
import { C } from "../chartTheme";

interface Props {
  data: DailyData[];
}

export default function CalendarHeatmap({ data }: Props) {
  if (!data.length) return null;

  const calData = data.map((d) => [d.date, d.launched] as [string, number]);
  const maxVal = Math.max(...data.map((d) => d.launched));

  // Build one calendar per year present in data
  const years = [...new Set(data.map((d) => d.date.slice(0, 4)))].sort();

  const calendars = years.map((yr, i) => ({
    top: 80 + i * 110,
    left: 80,
    right: 20,
    range: yr,
    cellSize: ["auto", 16],
    dayLabel: { nameMap: "en", color: C.label, fontSize: 10 },
    monthLabel: { color: C.text, fontSize: 11, nameMap: "en" },
    yearLabel: { show: true, color: C.text, fontSize: 13, fontWeight: "bold", position: "left" },
    itemStyle: { borderWidth: 2, borderColor: "#0a0f1a" },
    splitLine: { show: false },
  }));

  const series = years.map((_, i) => ({
    type: "heatmap",
    coordinateSystem: "calendar",
    calendarIndex: i,
    data: calData,
  }));

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      formatter: (params: { value: [string, number] }) => {
        const [date, count] = params.value;
        if (!count) return `<div style="font-size:11px;color:#64748b">${date}</div><div>No attacks recorded</div>`;
        return `
          <div style="font-size:11px;color:#64748b;margin-bottom:4px">${date}</div>
          <div>🚀 Launched: <strong style="color:#f1f5f9">${count}</strong></div>
        `;
      },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      type: "continuous",
      orient: "horizontal",
      left: "center",
      bottom: 12,
      text: ["Heavy", "None"],
      textStyle: { color: C.text, fontSize: 11 },
      inRange: {
        color: ["#1e293b", "#fef3c7", "#fbbf24", "#ef4444", "#7f1d1d"],
      },
      itemWidth: 16,
      itemHeight: 120,
    },
    calendar: calendars,
    series,
  };

  const height = years.length * 110 + 120;

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Attack Intensity Calendar</h2>
      <p className="text-brand-text text-sm mb-4">
        Each cell = one day. Darker red = more missiles launched. Hover for details.
      </p>
      <ReactECharts option={option} style={{ height }} notMerge />
    </section>
  );
}

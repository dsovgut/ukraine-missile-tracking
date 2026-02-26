import ReactECharts from "echarts-for-react";
import type { WeeklyData } from "../types";
import { C } from "../chartTheme";
import { useTranslation } from "../i18n";

interface Props {
  data: WeeklyData[];
}

export default function WeeklyBarsChart({ data }: Props) {
  const { t } = useTranslation();
  if (!data.length) return null;

  const weeks = data.map((d) => d.week_start);
  const intercepted = data.map((d) => d.destroyed);
  const missed = data.map((d) => d.launched - d.destroyed);

  const interceptedLabel = t("weeklyIntercepted");
  const gotThroughLabel = t("weeklyGotThrough");

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: { seriesName: string; value: number; name: string }[]) => {
        const week = params[0]?.name ?? "";
        const row = data[weeks.indexOf(week)];
        if (!row) return "";
        return `
          <div style="font-size:11px;color:#64748b;margin-bottom:6px">${t("weeklyWeekOf")} ${week}</div>
          <div style="color:#ef4444">⬆ ${t("weeklyLaunchedLabel")} <strong style="color:#f1f5f9">${row.launched}</strong></div>
          <div style="color:#22c55e">🛡 ${t("weeklyInterceptedLabel")} <strong style="color:#f1f5f9">${row.destroyed}</strong></div>
          <div style="color:#ef4444">💥 ${t("weeklyGotThroughLabel")} <strong style="color:#f1f5f9">${row.launched - row.destroyed}</strong></div>
          <div style="color:#60a5fa;margin-top:4px">${t("weeklyRateLabel")} <strong style="color:#f1f5f9">${row.efficiency}%</strong></div>
        `;
      },
    },
    legend: {
      top: 8,
      right: 16,
      textStyle: { color: C.text, fontSize: 12 },
    },
    grid: { left: 52, right: 20, top: 52, bottom: 64, containLabel: false },
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
      name: t("weeklyMissiles"),
      nameTextStyle: { color: C.label, fontSize: 11 },
      ...C.axisStyle,
    },
    dataZoom: [{ type: "inside", start: 0, end: 100 }],
    series: [
      {
        name: interceptedLabel,
        type: "bar",
        stack: "total",
        data: intercepted,
        itemStyle: { color: C.destroyed },
        emphasis: { itemStyle: { color: "#4ade80" } },
      },
      {
        name: gotThroughLabel,
        type: "bar",
        stack: "total",
        data: missed,
        itemStyle: { color: C.launched },
        emphasis: { itemStyle: { color: "#f87171" } },
      },
    ],
  };

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">{t("weeklyTitle")}</h2>
      <p className="text-brand-text text-sm mb-4">{t("weeklySubtitle")}</p>
      <ReactECharts option={option} style={{ height: 360 }} notMerge />
    </section>
  );
}

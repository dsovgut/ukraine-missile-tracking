import ReactECharts from "echarts-for-react";
import type { DailyData } from "../types";
import { C } from "../chartTheme";
import { useTranslation } from "../i18n";

interface Props {
  data: DailyData[];
}

function rollingAvg(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return Math.round((slice.reduce((a, b) => a + b, 0) / window) * 10) / 10;
  });
}

export default function TimeSeriesChart({ data }: Props) {
  const { t } = useTranslation();
  if (!data.length) return null;

  const dates = data.map((d) => d.date);
  const launched = data.map((d) => d.launched);
  const destroyed = data.map((d) => d.destroyed);
  const launchedAvg = rollingAvg(launched, 7);
  const destroyedAvg = rollingAvg(destroyed, 7);

  const launchedDailyLabel = t("timeseriesLaunchedDaily");
  const interceptedDailyLabel = t("timeseriesInterceptedDaily");
  const launched7dLabel = t("timeseriesLaunched7d");
  const intercepted7dLabel = t("timeseriesIntercepted7d");

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      axisPointer: { type: "cross", crossStyle: { color: "#475569" } },
      formatter: (params: { seriesName: string; value: number; name: string }[]) => {
        const date = params[0]?.name ?? "";
        const lines = params
          .filter((p) => p.value != null)
          .map((p) => {
            const isLaunched =
              p.seriesName === launchedDailyLabel || p.seriesName === launched7dLabel;
            const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${
              isLaunched ? C.launched : C.destroyed
            };margin-right:6px;"></span>`;
            return `${dot}<span style="color:#94a3b8">${p.seriesName}:</span> <strong style="color:#f1f5f9">${p.value}</strong>`;
          })
          .join("<br/>");
        return `<div style="font-size:11px;color:#64748b;margin-bottom:4px">${date}</div>${lines}`;
      },
    },
    legend: {
      top: 8,
      right: 16,
      textStyle: { color: C.text, fontSize: 12 },
      itemWidth: 20,
      itemHeight: 3,
    },
    grid: { left: 56, right: 20, top: 56, bottom: 72, containLabel: false },
    xAxis: {
      type: "category",
      data: dates,
      ...C.axisStyle,
      axisLabel: {
        ...C.axisStyle.axisLabel,
        formatter: (v: string) => v.slice(0, 7),
        interval: Math.floor(dates.length / 12),
        rotate: 30,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      name: t("timeseriesMissiles"),
      nameTextStyle: { color: C.label, fontSize: 11 },
      ...C.axisStyle,
      minInterval: 1,
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      {
        type: "slider",
        bottom: 4,
        height: 22,
        borderColor: C.axis,
        fillerColor: "rgba(0,91,187,0.15)",
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
        name: launchedDailyLabel,
        type: "bar",
        data: launched,
        itemStyle: { color: "rgba(239,68,68,0.45)" },
        barMaxWidth: 3,
        z: 1,
      },
      {
        name: interceptedDailyLabel,
        type: "bar",
        data: destroyed,
        itemStyle: { color: "rgba(34,197,94,0.45)" },
        barMaxWidth: 3,
        z: 1,
      },
      {
        name: launched7dLabel,
        type: "line",
        data: launchedAvg,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: C.launched, width: 2.5 },
        z: 3,
      },
      {
        name: intercepted7dLabel,
        type: "line",
        data: destroyedAvg,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: C.destroyed, width: 2.5 },
        z: 3,
      },
    ],
  };

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">{t("timeseriesTitle")}</h2>
      <ReactECharts option={option} style={{ height: 420 }} notMerge />
    </section>
  );
}

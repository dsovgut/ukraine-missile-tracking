import ReactECharts from "echarts-for-react";
import type { PredictionData } from "../types";
import { C } from "../chartTheme";

interface Props {
  data: PredictionData | null;
}

export default function PredictionChart({ data }: Props) {
  if (!data || data.status !== "ok" || !data.forecast.length) return null;

  const recentDates = data.recent.map((r) => r.date);
  const forecastDates = data.forecast.map((f) => f.date);
  const allDates = [...recentDates, ...forecastDates];

  // Actual values — only in the recent range, null elsewhere
  const actualValues = [
    ...data.recent.map((r) => r.launched),
    ...data.forecast.map(() => null),
  ];

  // Forecast values — null for the recent range, then predictions
  // Include last actual day as the connection point
  const forecastValues: (number | null)[] = [
    ...data.recent.slice(0, -1).map(() => null),
    data.recent.length > 0 ? data.recent[data.recent.length - 1].launched : null,
    ...data.forecast.map((f) => f.predicted_launched),
  ];

  const info = data.model_info;

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis" as const,
      axisPointer: { type: "cross" as const, crossStyle: { color: "#475569" } },
    },
    legend: {
      top: 8,
      right: 16,
      textStyle: { color: C.text, fontSize: 12 },
      itemWidth: 20,
      itemHeight: 3,
    },
    grid: { left: 56, right: 20, top: 56, bottom: 40, containLabel: false },
    xAxis: {
      type: "category" as const,
      data: allDates,
      ...C.axisStyle,
      axisLabel: {
        ...C.axisStyle.axisLabel,
        formatter: (v: string) => v.slice(5), // MM-DD
        interval: Math.max(1, Math.floor(allDates.length / 10)),
        rotate: 30,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: "value" as const,
      name: "Missiles Launched",
      nameTextStyle: { color: C.label, fontSize: 11 },
      ...C.axisStyle,
      minInterval: 1,
    },
    visualMap: {
      show: false,
      pieces: [
        { gte: 0, lte: recentDates.length - 1, color: C.launched },
        { gt: recentDates.length - 1, color: "#a78bfa" },
      ],
      dimension: 0,
      seriesIndex: 1,
    },
    series: [
      {
        name: "Actual",
        type: "line",
        data: actualValues,
        smooth: false,
        showSymbol: true,
        symbolSize: 4,
        lineStyle: { color: C.launched, width: 2 },
        itemStyle: { color: C.launched },
        z: 3,
      },
      {
        name: "Forecast",
        type: "line",
        data: forecastValues,
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { color: "#a78bfa", width: 2.5, type: "dashed" as const },
        itemStyle: { color: "#a78bfa" },
        areaStyle: {
          color: {
            type: "linear" as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(167,139,250,0.18)" },
              { offset: 1, color: "rgba(167,139,250,0.02)" },
            ],
          },
        },
        z: 4,
      },
      {
        name: "Forecast boundary",
        type: "line",
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#555", type: "dashed" as const, width: 1 },
          data: [{ xAxis: recentDates[recentDates.length - 1] }],
          label: {
            formatter: "Forecast →",
            color: "#888",
            fontSize: 11,
            position: "insideEndTop" as const,
          },
        },
        data: [],
      },
    ],
  };

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-4">
        <h2 className="text-xl font-bold text-white">
          14-Day Missile Launch Forecast
        </h2>
        {info && (
          <span className="text-xs text-brand-muted">
            {info.name} model &middot; R&sup2; {info.r2.toFixed(4)} &middot;{" "}
            {info.features_used} features
          </span>
        )}
      </div>
      <ReactECharts option={option} style={{ height: 400 }} notMerge />
      <p className="text-xs text-brand-muted mt-3">
        Predictions generated using an Elastic Net regression model trained on
        historical attack patterns, weather data, and temporal features.
        Forecast accuracy is limited (R&sup2;&nbsp;=&nbsp;{info?.r2.toFixed(2)})
        &mdash; treat as directional guidance only.
      </p>
    </section>
  );
}

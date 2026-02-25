import ReactECharts from "echarts-for-react";
import type { DailyData } from "../types";
import { C } from "../chartTheme";

interface Props {
  data: DailyData[];
}

function linReg(points: [number, number][]) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, [x]) => s + x, 0);
  const sumY = points.reduce((s, [, y]) => s + y, 0);
  const sumXY = points.reduce((s, [x, y]) => s + x * y, 0);
  const sumXX = points.reduce((s, [x]) => s + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function scatterOpts(
  points: [number, number][],
  xLabel: string,
  xUnit: string,
  color: string
) {
  if (!points.length) return {};

  const xVals = points.map(([x]) => x);
  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const reg = linReg(points);

  const trendData = reg
    ? [
        [minX, reg.slope * minX + reg.intercept],
        [maxX, reg.slope * maxX + reg.intercept],
      ]
    : [];

  return {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "item",
      formatter: (params: { value: [number, number] }) =>
        `<div style="font-size:11px;color:#64748b">${xLabel}</div>` +
        `<div>${xLabel}: <strong style="color:#f1f5f9">${params.value[0]}${xUnit}</strong></div>` +
        `<div>Launched: <strong style="color:#f1f5f9">${params.value[1]}</strong></div>`,
    },
    grid: { left: 48, right: 12, top: 32, bottom: 44, containLabel: false },
    xAxis: {
      type: "value",
      name: `${xLabel} (${xUnit})`,
      nameLocation: "middle",
      nameGap: 28,
      nameTextStyle: { color: C.label, fontSize: 10 },
      ...C.axisStyle,
    },
    yAxis: {
      type: "value",
      name: "Launched",
      nameTextStyle: { color: C.label, fontSize: 10 },
      ...C.axisStyle,
    },
    series: [
      {
        type: "scatter",
        data: points,
        itemStyle: { color, opacity: 0.55 },
        symbolSize: 5,
      },
      ...(trendData.length
        ? [
            {
              type: "line",
              data: trendData,
              lineStyle: { color: "rgba(255,255,255,0.4)", type: "dashed", width: 1.5 },
              showSymbol: false,
              smooth: false,
            },
          ]
        : []),
    ],
  };
}

export default function WeatherScatter({ data }: Props) {
  const withWeather = data.filter(
    (d) => d.temp_mean != null || d.precip != null || d.wind_speed != null || d.cloud_cover != null
  );
  if (!withWeather.length) return null;

  const tempPts = withWeather
    .filter((d) => d.temp_mean != null)
    .map((d) => [Math.round(d.temp_mean! * 10) / 10, d.launched] as [number, number]);
  const precipPts = withWeather
    .filter((d) => d.precip != null)
    .map((d) => [Math.round(d.precip! * 10) / 10, d.launched] as [number, number]);
  const windPts = withWeather
    .filter((d) => d.wind_speed != null)
    .map((d) => [Math.round(d.wind_speed! * 10) / 10, d.launched] as [number, number]);
  const cloudPts = withWeather
    .filter((d) => d.cloud_cover != null)
    .map((d) => [Math.round(d.cloud_cover! * 10) / 10, d.launched] as [number, number]);

  const panels = [
    { pts: tempPts, label: "Temperature", unit: "°C", color: "#f87171" },
    { pts: precipPts, label: "Precipitation", unit: "mm", color: "#60a5fa" },
    { pts: windPts, label: "Wind Speed", unit: "km/h", color: "#a78bfa" },
    { pts: cloudPts, label: "Cloud Cover", unit: "%", color: "#94a3b8" },
  ];

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Weather vs Attacks</h2>
      <p className="text-brand-text text-sm mb-6">
        Each dot is one day. Dashed line shows the linear trend. Correlation is generally weak — attacks follow strategic, not weather-driven, patterns.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {panels.map(({ pts, label, unit, color }) => (
          <div key={label}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</h3>
            <ReactECharts
              option={scatterOpts(pts, label, unit, color)}
              style={{ height: 240 }}
              notMerge
            />
          </div>
        ))}
      </div>
    </section>
  );
}

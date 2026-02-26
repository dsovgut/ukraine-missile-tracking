import ReactECharts from "echarts-for-react";
import type { WeeklyData } from "../types";
import { C } from "../chartTheme";
import { useTranslation } from "../i18n";

interface Props {
  data: WeeklyData[];
}

function linReg(x: number[], y: number[]) {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumXX = x.reduce((s, xi) => s + xi * xi, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default function DefenseEfficiency({ data }: Props) {
  const { t } = useTranslation();
  if (!data.length) return null;

  const weeks = data.map((d) => d.week_start);
  const efficiencies = data.map((d) => d.efficiency);
  const avg = Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length);

  const xs = efficiencies.map((_, i) => i);
  const { slope, intercept } = linReg(xs, efficiencies);
  const trendLine = xs.map((x) => Math.round((slope * x + intercept) * 10) / 10);

  const efficiencyLabel = t("defenseEfficiency");
  const trendLabel = t("defenseTrend");

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      formatter: (params: { name: string; value: number; seriesName: string }[]) => {
        const week = params[0]?.name ?? "";
        const eff = params.find((p) => p.seriesName === efficiencyLabel)?.value;
        const trend = params.find((p) => p.seriesName === trendLabel)?.value;
        return `
          <div style="font-size:11px;color:#64748b;margin-bottom:4px">${t("defenseWeekOf")} ${week}</div>
          <div>🛡 ${t("defenseEfficiencyLabel")} <strong style="color:#60a5fa">${eff}%</strong></div>
          ${trend != null ? `<div>📈 ${t("defenseTrendLabel")} <strong style="color:#f59e0b">${trend}%</strong></div>` : ""}
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
      name: "%",
      min: 0,
      max: 100,
      nameTextStyle: { color: C.label, fontSize: 11 },
      ...C.axisStyle,
    },
    markLine: {
      data: [{ yAxis: avg, name: `Avg ${avg}%` }],
    },
    series: [
      {
        name: efficiencyLabel,
        type: "line",
        data: efficiencies,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: C.efficiency, width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(96,165,250,0.3)" },
              { offset: 1, color: "rgba(96,165,250,0.0)" },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: C.text, type: "dashed", width: 1 },
          data: [{ type: "average", name: `Avg ${avg}%` }],
          label: { color: C.text, fontSize: 10, formatter: "Avg {c}%" },
        },
      },
      {
        name: trendLabel,
        type: "line",
        data: trendLine,
        smooth: false,
        showSymbol: false,
        lineStyle: { color: C.personnel, width: 2, type: "dashed" },
      },
    ],
  };

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">{t("defenseTitle")}</h2>
      <p className="text-brand-text text-sm mb-4">{t("defenseSubtitle")}</p>
      <ReactECharts option={option} style={{ height: 360 }} notMerge />
    </section>
  );
}

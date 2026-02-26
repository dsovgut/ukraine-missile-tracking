import { useState } from "react";
import ReactECharts from "echarts-for-react";
import type { ByModelData, MissileType } from "../types";
import { C } from "../chartTheme";
import { useTranslation } from "../i18n";

interface Props {
  types: MissileType[];
  byModel: ByModelData[];
}

// Aggregate by-model daily data into monthly buckets for the selected type
function aggregateMonthly(byModel: ByModelData[], model: string) {
  const buckets: Record<string, { launched: number; destroyed: number }> = {};
  for (const d of byModel) {
    if (d.model !== model) continue;
    const month = d.date.slice(0, 7); // YYYY-MM
    if (!buckets[month]) buckets[month] = { launched: 0, destroyed: 0 };
    buckets[month].launched += d.launched;
    buckets[month].destroyed += d.destroyed;
  }
  const months = Object.keys(buckets).sort();
  return months.map((m) => ({ month: m, ...buckets[m] }));
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function efficiencyColor(pct: number) {
  if (pct >= 80) return "#22c55e";
  if (pct >= 60) return "#60a5fa";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

// Overview chart: horizontal ranked bar for all types
function OverviewChart({ types }: { types: MissileType[] }) {
  const { t } = useTranslation();
  const sorted = [...types].sort((a, b) => a.total_launched - b.total_launched);
  const models = sorted.map((item) => item.model);
  const intercepted = sorted.map((item) => item.total_destroyed);
  const gotThrough = sorted.map((item) => item.total_launched - item.total_destroyed);

  const interceptedLabel = t("missileIntercepted");
  const gotThroughLabel = t("cumulativeGotThrough");

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: { name: string; value: number; seriesName: string }[]) => {
        const model = params[0]?.name ?? "";
        const intp = params.find((p) => p.seriesName === interceptedLabel)?.value ?? 0;
        const got = params.find((p) => p.seriesName === gotThroughLabel)?.value ?? 0;
        const total = intp + got;
        const pct = total > 0 ? Math.round((intp / total) * 100) : 0;
        return `
          <div style="font-weight:700;color:#e5e5e5;margin-bottom:4px">${model}</div>
          <div style="margin-bottom:2px">🚀 ${t("missileLaunchedLabel")} <strong style="color:${C.launched}">${fmt(total)}</strong></div>
          <div style="margin-bottom:2px">🛡 ${t("missileInterceptedLabel")} <strong style="color:${C.destroyed}">${fmt(intp)}</strong></div>
          <div style="margin-bottom:2px">💥 ${t("missileGotThroughLabel")} <strong style="color:#737373">${fmt(got)}</strong></div>
          <div>📊 ${t("missileEfficiencyLabel")} <strong style="color:${efficiencyColor(pct)}">${pct}%</strong></div>
        `;
      },
    },
    grid: { top: 8, right: 80, bottom: 24, left: 160 },
    xAxis: {
      type: "value",
      ...C.axisStyle,
      axisLabel: {
        ...C.axisStyle.axisLabel,
        formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
      },
    },
    yAxis: {
      type: "category",
      data: models,
      ...C.axisStyle,
      axisLabel: { ...C.axisStyle.axisLabel, fontSize: 11, width: 150, overflow: "truncate" },
    },
    series: [
      {
        name: interceptedLabel,
        type: "bar",
        stack: "total",
        data: intercepted,
        barMaxWidth: 24,
        itemStyle: { color: "rgba(34,197,94,0.55)", borderRadius: [0, 0, 0, 0] },
        emphasis: { itemStyle: { color: "rgba(34,197,94,0.8)" } },
      },
      {
        name: gotThroughLabel,
        type: "bar",
        stack: "total",
        data: gotThrough,
        barMaxWidth: 24,
        itemStyle: { color: "rgba(239,68,68,0.55)", borderRadius: [0, 4, 4, 0] },
        emphasis: { itemStyle: { color: "rgba(239,68,68,0.8)" } },
        label: {
          show: true,
          position: "right",
          color: C.label,
          fontSize: 10,
          formatter: (p: { dataIndex: number }) => {
            const item = sorted[p.dataIndex];
            const pct =
              item.total_launched > 0
                ? Math.round((item.total_destroyed / item.total_launched) * 100)
                : 0;
            return `${fmt(item.total_launched)}  ${pct}%`;
          },
        },
      },
    ],
  };

  const chartHeight = Math.max(280, sorted.length * 36 + 48);
  return <ReactECharts option={option} style={{ height: chartHeight }} notMerge />;
}

// Detail chart: monthly launched vs intercepted for one type
function TypeDetailChart({
  model,
  byModel,
  typeSummary,
}: {
  model: string;
  byModel: ByModelData[];
  typeSummary: MissileType;
}) {
  const { t } = useTranslation();
  const monthly = aggregateMonthly(byModel, model);
  if (!monthly.length) return <p className="text-brand-text text-sm py-8">No data available.</p>;

  const months = monthly.map((m) => m.month);
  const launched = monthly.map((m) => m.launched);
  const destroyed = monthly.map((m) => m.destroyed);
  const gotThrough = monthly.map((m) => m.launched - m.destroyed);

  const launchedLabel = t("missileLaunchedLabel").replace(":", "");
  const interceptedLabel = t("missileIntercepted");
  const gotThroughLabel = t("cumulativeGotThrough");

  const option = {
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: { name: string; value: number; seriesName: string }[]) => {
        const month = params[0]?.name ?? "";
        const l = params.find((p) => p.seriesName === launchedLabel)?.value ?? 0;
        const d = params.find((p) => p.seriesName === interceptedLabel)?.value ?? 0;
        const pct = l > 0 ? Math.round((d / l) * 100) : 0;
        return `
          <div style="font-size:11px;color:#64748b;margin-bottom:4px">${month}</div>
          <div style="margin-bottom:2px">🚀 ${t("missileLaunchedLabel")} <strong style="color:${C.launched}">${fmt(l)}</strong></div>
          <div style="margin-bottom:2px">🛡 ${t("missileInterceptedLabel")} <strong style="color:${C.destroyed}">${fmt(d)}</strong></div>
          <div>📊 ${t("missileEfficiencyLabel")} <strong style="color:${efficiencyColor(pct)}">${pct}%</strong></div>
        `;
      },
    },
    legend: {
      data: [launchedLabel, interceptedLabel],
      textStyle: { color: C.label, fontSize: 11 },
      top: 4,
      right: 8,
    },
    grid: { top: 36, right: 16, bottom: 24, left: 48 },
    xAxis: {
      type: "category",
      data: months,
      ...C.axisStyle,
      axisLabel: { ...C.axisStyle.axisLabel, rotate: 45 },
    },
    yAxis: { type: "value", ...C.axisStyle, minInterval: 1 },
    series: [
      {
        name: launchedLabel,
        type: "bar",
        data: launched,
        barMaxWidth: 28,
        itemStyle: { color: C.launchedSoft, borderColor: C.launched, borderWidth: 1 },
        emphasis: { itemStyle: { color: "rgba(239,68,68,0.5)" } },
      },
      {
        name: interceptedLabel,
        type: "bar",
        data: destroyed,
        barMaxWidth: 28,
        itemStyle: { color: C.destroyedSoft, borderColor: C.destroyed, borderWidth: 1 },
        emphasis: { itemStyle: { color: "rgba(34,197,94,0.5)" } },
      },
      {
        name: gotThroughLabel,
        type: "line",
        data: gotThrough,
        showSymbol: false,
        lineStyle: { color: C.text, width: 1, type: "dashed" },
      },
    ],
  };

  const pctColor = efficiencyColor(typeSummary.efficiency);

  return (
    <div>
      <div className="flex gap-6 mb-4 flex-wrap">
        <div>
          <div className="text-2xl font-black text-white tabular-nums leading-none">
            {fmt(typeSummary.total_launched)}
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#555] mt-1">
            {t("missileTotalLaunched")}
          </div>
        </div>
        <div>
          <div className="text-2xl font-black tabular-nums leading-none" style={{ color: C.destroyed }}>
            {fmt(typeSummary.total_destroyed)}
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#555] mt-1">
            {t("missileIntercepted")}
          </div>
        </div>
        <div>
          <div className="text-2xl font-black tabular-nums leading-none" style={{ color: C.launched }}>
            {fmt(typeSummary.total_launched - typeSummary.total_destroyed)}
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#555] mt-1">
            {t("missileGotThrough")}
          </div>
        </div>
        <div>
          <div className="text-2xl font-black tabular-nums leading-none" style={{ color: pctColor }}>
            {typeSummary.efficiency}%
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#555] mt-1">
            {t("missileEfficiency")}
          </div>
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 320 }} notMerge />
    </div>
  );
}

export default function MissileTypeExplorer({ types, byModel }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  if (!types.length) return null;

  const sorted = [...types].sort((a, b) => b.total_launched - a.total_launched);
  const activeSummary = selected ? sorted.find((item) => item.model === selected) ?? null : null;

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">{t("missileTitle")}</h2>
      <p className="text-brand-text text-sm mb-5">
        {selected
          ? `${t("missileSubtitleSelectedPrefix")} ${selected}${t("missileSubtitleSelectedSuffix")}`
          : t("missileSubtitleAll")}
      </p>

      {/* Pill selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelected(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            selected === null
              ? "bg-brand-red border-brand-red text-white"
              : "border-brand-border text-[#555] hover:border-[#444] hover:text-[#888]"
          }`}
        >
          {t("missileAllTypes")}
        </button>
        {sorted.map((item) => (
          <button
            key={item.model}
            onClick={() => setSelected(item.model)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              selected === item.model
                ? "bg-brand-red border-brand-red text-white"
                : "border-brand-border text-[#555] hover:border-[#444] hover:text-[#888]"
            }`}
          >
            {item.model}
          </button>
        ))}
      </div>

      {selected && activeSummary ? (
        <TypeDetailChart model={selected} byModel={byModel} typeSummary={activeSummary} />
      ) : (
        <OverviewChart types={types} />
      )}
    </section>
  );
}

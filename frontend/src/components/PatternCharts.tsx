import ReactECharts from "echarts-for-react";
import type { DailyData } from "../types";
import { C } from "../chartTheme";

interface Props {
  data: DailyData[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PatternCharts({ data }: Props) {
  if (!data.length) return null;

  // Monthly averages
  const monthBuckets: number[][] = Array.from({ length: 12 }, () => []);
  data.forEach((d) => {
    const m = new Date(d.date).getUTCMonth();
    if (d.launched > 0) monthBuckets[m].push(d.launched);
  });
  const monthAvgs = monthBuckets.map((b) =>
    b.length ? Math.round((b.reduce((a, c) => a + c, 0) / b.length) * 10) / 10 : 0
  );

  // Day-of-week averages (JS: 0=Sun, 1=Mon … 6=Sat → remap to Mon–Sun)
  const dayBuckets: number[][] = Array.from({ length: 7 }, () => []);
  data.forEach((d) => {
    const jsDay = new Date(d.date).getUTCDay(); // 0=Sun
    const idx = jsDay === 0 ? 6 : jsDay - 1;   // 0=Mon … 6=Sun
    if (d.launched > 0) dayBuckets[idx].push(d.launched);
  });
  const dayAvgs = dayBuckets.map((b) =>
    b.length ? Math.round((b.reduce((a, c) => a + c, 0) / b.length) * 10) / 10 : 0
  );

  const barOpts = (categories: string[], values: number[], xLabel: string) => ({
    backgroundColor: C.bg,
    tooltip: {
      ...C.tooltip,
      trigger: "axis",
      formatter: (params: { name: string; value: number }[]) =>
        `<div style="font-size:11px;color:#64748b">${params[0]?.name}</div>` +
        `<div>Avg: <strong style="color:#f1f5f9">${params[0]?.value}</strong> missiles</div>`,
    },
    grid: { left: 52, right: 16, top: 28, bottom: 48, containLabel: false },
    xAxis: {
      type: "category",
      data: categories,
      name: xLabel,
      nameLocation: "middle",
      nameGap: 32,
      nameTextStyle: { color: C.label, fontSize: 11 },
      ...C.axisStyle,
    },
    yAxis: {
      type: "value",
      name: "Avg launches",
      nameTextStyle: { color: C.label, fontSize: 11 },
      ...C.axisStyle,
    },
    series: [
      {
        type: "bar",
        data: values.map((v) => ({
          value: v,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: C.launched },
                { offset: 1, color: "rgba(239,68,68,0.4)" },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        })),
        barMaxWidth: 40,
        label: {
          show: true,
          position: "top",
          color: C.text,
          fontSize: 10,
          formatter: "{c}",
        },
      },
    ],
  });

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">Attack Patterns</h2>
      <p className="text-brand-text text-sm mb-6">
        Average missiles launched per day, broken down by month and day of week (days with 0 attacks excluded).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">By Month</h3>
          <ReactECharts
            option={barOpts(MONTH_NAMES, monthAvgs, "Month")}
            style={{ height: 280 }}
            notMerge
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">By Day of Week</h3>
          <ReactECharts
            option={barOpts(DAY_NAMES, dayAvgs, "Day")}
            style={{ height: 280 }}
            notMerge
          />
        </div>
      </div>
    </section>
  );
}

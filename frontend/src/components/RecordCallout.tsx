import type { DailyData } from "../types";

interface Props {
  daily: DailyData[];
  /** Which subset of records to show */
  variant: "attacks" | "defense";
}

interface RecordCard {
  icon: string;
  label: string;
  value: string;
  detail: string;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeRecords(daily: DailyData[]) {
  const attackDays = daily.filter((d) => d.launched > 0);
  if (!attackDays.length) return null;

  // Largest single attack
  const biggest = attackDays.reduce((m, d) => (d.launched > m.launched ? d : m), attackDays[0]);

  // Most intercepted in a single day
  const mostIntercepted = attackDays.reduce(
    (m, d) => (d.destroyed > m.destroyed ? d : m),
    attackDays[0],
  );

  // Best interception rate on a significant attack day (≥20 missiles)
  const sigDays = attackDays.filter((d) => d.launched >= 20);
  const bestRate =
    sigDays.length > 0
      ? sigDays.reduce((m, d) => {
          const r = d.destroyed / d.launched;
          const mr = m.destroyed / m.launched;
          return r > mr ? d : m;
        }, sigDays[0])
      : null;

  // Longest gap between consecutive attack dates
  const sorted = [...attackDays].sort((a, b) => a.date.localeCompare(b.date));
  let maxGapDays = 0;
  let gapEndDate = "";
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const gap = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    if (gap > maxGapDays) {
      maxGapDays = gap;
      gapEndDate = sorted[i].date;
    }
  }

  return { biggest, mostIntercepted, bestRate, maxGapDays, gapEndDate };
}

export default function RecordCallout({ daily, variant }: Props) {
  const r = computeRecords(daily);
  if (!r) return null;

  const cards: RecordCard[] =
    variant === "attacks"
      ? [
          {
            icon: "⚡",
            label: "Record attack",
            value: `${r.biggest.launched.toLocaleString()} missiles`,
            detail: fmtDate(r.biggest.date),
          },
          {
            icon: "⏱",
            label: "Longest pause",
            value: `${r.maxGapDays} days silence`,
            detail: `ended ${fmtDate(r.gapEndDate)}`,
          },
        ]
      : [
          {
            icon: "🛡",
            label: "Best defense day",
            value: r.bestRate
              ? `${Math.round((r.bestRate.destroyed / r.bestRate.launched) * 100)}% stopped`
              : "—",
            detail: r.bestRate ? fmtDate(r.bestRate.date) : "",
          },
          {
            icon: "🎯",
            label: "Most intercepted",
            value: `${r.mostIntercepted.destroyed.toLocaleString()} in one day`,
            detail: fmtDate(r.mostIntercepted.date),
          },
        ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-start gap-4 rounded-xl border border-brand-border bg-brand-card px-6 py-5"
        >
          <span className="text-3xl mt-1">{c.icon}</span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-2">
              {c.label}
            </div>
            <div className="text-3xl font-black text-white leading-none tabular-nums">{c.value}</div>
            <div className="text-sm text-[#555] mt-2">{c.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

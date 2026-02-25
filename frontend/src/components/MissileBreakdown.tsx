import type { MissileType } from "../types";

interface Props {
  types: MissileType[];
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function effColor(eff: number) {
  if (eff >= 80) return "#22c55e";
  if (eff >= 60) return "#60a5fa";
  if (eff >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function MissileBreakdown({ types }: Props) {
  if (!types.length) return null;

  const maxLaunched = Math.max(...types.map((t) => t.total_launched));

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-white mb-1">Missile &amp; Drone Breakdown</h2>
      <p className="text-brand-text text-sm mb-6">Total launched vs intercepted by weapon type, sorted by volume.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {types.map((t) => (
          <div
            key={t.model}
            className="bg-brand-card border border-brand-border rounded-xl p-4 hover:border-brand-muted transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-semibold text-white text-sm">{t.model}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${effColor(t.efficiency)}22`, color: effColor(t.efficiency) }}
              >
                {t.efficiency}% intercepted
              </span>
            </div>

            {/* Stacked bar */}
            <div className="h-3 rounded-full bg-brand-border overflow-hidden mb-2">
              <div
                className="h-full flex"
                style={{ width: `${(t.total_launched / maxLaunched) * 100}%` }}
              >
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(t.total_destroyed / t.total_launched) * 100}%` }}
                />
                <div className="h-full bg-red-500 flex-1" />
              </div>
            </div>

            <div className="flex gap-4 text-xs text-brand-text">
              <span>
                <span className="text-red-400 font-semibold">{fmt(t.total_launched)}</span> launched
              </span>
              <span>
                <span className="text-green-400 font-semibold">{fmt(t.total_destroyed)}</span> intercepted
              </span>
              <span>
                <span className="text-red-300 font-semibold">{fmt(t.total_launched - t.total_destroyed)}</span> got through
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

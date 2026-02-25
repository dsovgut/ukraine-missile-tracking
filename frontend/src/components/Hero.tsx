import type { Stats } from "../types";

interface Props {
  stats: Stats | null;
  loading: boolean;
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function KpiCard({
  label,
  value,
  sub,
  color = "white",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <span className={`text-3xl font-black leading-none`} style={{ color }}>
        {value}
      </span>
      {sub && <span className="text-sm text-gray-400 font-medium">{sub}</span>}
    </div>
  );
}

function PeriodBlock({
  label,
  launched,
  destroyed,
  efficiency,
}: {
  label: string;
  launched: number;
  destroyed: number;
  efficiency: number;
}) {
  return (
    <div className="text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">
        <span className="text-red-400">{fmt(launched)}</span>
        <span className="text-gray-500 mx-1">/</span>
        <span className="text-green-400">{fmt(destroyed)}</span>
      </div>
      <div className="text-sm text-blue-400 font-semibold">{efficiency}% intercepted</div>
    </div>
  );
}

export default function Hero({ stats, loading }: Props) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-brand-bg border-b border-brand-border">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #005BBB 0%, transparent 50%), radial-gradient(circle at 80% 50%, #FFD700 0%, transparent 50%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🇺🇦</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Ukraine Missile Tracker
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Tracking Russian missile and drone attacks on Ukraine
            {stats?.all_time && (
              <span className="ml-1 text-gray-500">
                · {stats.all_time.first_date} — {stats.all_time.last_date}
              </span>
            )}
          </p>
        </div>

        {loading || !stats ? (
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5" />
            ))}
          </div>
        ) : (
          <>
            {/* Latest attack KPIs */}
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-ukraine-yellow">
                Most recent — {stats.today.date}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KpiCard
                label="Missiles Launched"
                value={fmt(stats.today.launched)}
                sub="that day"
                color="#ef4444"
              />
              <KpiCard
                label="Intercepted"
                value={fmt(stats.today.destroyed)}
                sub="that day"
                color="#22c55e"
              />
              <KpiCard
                label="Interception Rate"
                value={`${stats.today.efficiency}%`}
                sub="that day"
                color="#60a5fa"
              />
              <KpiCard
                label="Days Tracked"
                value={fmt(stats.all_time.days)}
                sub={`since ${stats.all_time.first_date}`}
                color="#FFD700"
              />
            </div>

            {/* Period summaries */}
            <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-4 divide-x divide-white/10">
              <PeriodBlock
                label="This Week"
                launched={stats.this_week.launched}
                destroyed={stats.this_week.destroyed}
                efficiency={stats.this_week.efficiency}
              />
              <div className="pl-4">
                <PeriodBlock
                  label="This Month"
                  launched={stats.this_month.launched}
                  destroyed={stats.this_month.destroyed}
                  efficiency={stats.this_month.efficiency}
                />
              </div>
              <div className="pl-4">
                <PeriodBlock
                  label="All Time"
                  launched={stats.all_time.launched}
                  destroyed={stats.all_time.destroyed}
                  efficiency={stats.all_time.efficiency}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

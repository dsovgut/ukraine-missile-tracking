import type { Stats } from "../types";

interface Props {
  stats: Stats | null;
  loading: boolean;
  totalCasualties?: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
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
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-3">{label}</div>
      <div className="text-2xl font-black text-white tabular-nums leading-none">{fmt(launched)}</div>
      <div className="text-xs text-[#555] mt-1 mb-2">launched</div>
      <div className="text-sm font-semibold text-[#737373] tabular-nums">{fmt(destroyed)} intercepted</div>
      <div className="text-xs font-bold text-[#ef4444] mt-1">{efficiency}% stopped</div>
    </div>
  );
}

export default function Hero({ stats, loading, totalCasualties }: Props) {
  return (
    <header className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            Ukraine Missile Tracker
          </h1>
          <p className="text-[#666] text-sm">
            Documenting Russian missile and drone attacks on Ukraine
            {stats?.all_time && (
              <span className="ml-1">
                · {stats.all_time.first_date} — {stats.all_time.last_date}
              </span>
            )}
          </p>
        </div>

        {loading || !stats ? (
          <div className="animate-pulse space-y-6">
            <div className="h-24 w-48 rounded bg-white/5" />
            <div className="h-4 w-64 rounded bg-white/5" />
            <div className="h-px w-full bg-white/5 mt-8" />
            <div className="grid grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded bg-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Hero stat block */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-10 sm:gap-16 mb-12">
              {/* Primary: Most recent attack */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-3">
                  Most recent attack · {stats.today.date}
                </div>
                <div
                  className="text-[72px] sm:text-[96px] font-black leading-none tabular-nums"
                  style={{ color: "#ef4444", letterSpacing: "-0.03em" }}
                >
                  {fmt(stats.today.launched)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#555] mt-3">
                  Missiles Launched
                </div>
                <div className="flex gap-8 mt-4">
                  <div>
                    <div className="text-2xl font-black text-[#e5e5e5] tabular-nums leading-none">
                      {fmt(stats.today.destroyed)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      Intercepted
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#737373] tabular-nums leading-none">
                      {stats.today.efficiency}%
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      Stopped
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px self-stretch bg-[#1a1a1a]" />

              {/* All-time total */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-3">
                  Total since {stats.all_time.first_date}
                </div>
                <div
                  className="text-[72px] sm:text-[96px] font-black leading-none tabular-nums"
                  style={{ color: "#e5e5e5", letterSpacing: "-0.03em" }}
                >
                  {fmt(stats.all_time.launched)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#555] mt-3">
                  Missiles Fired at Ukraine
                </div>
                <div className="flex gap-8 mt-4">
                  <div>
                    <div className="text-2xl font-black text-[#22c55e] tabular-nums leading-none">
                      {fmt(stats.all_time.destroyed)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      Intercepted
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#737373] tabular-nums leading-none">
                      {stats.all_time.efficiency}%
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      Avg stopped
                    </div>
                  </div>
                </div>
              </div>

              {/* Casualties */}
              {totalCasualties != null && totalCasualties > 0 && (
                <>
                  <div className="hidden sm:block w-px self-stretch bg-[#1a1a1a]" />
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-3">
                      Russian casualties
                    </div>
                    <div
                      className="text-[72px] sm:text-[96px] font-black leading-none tabular-nums"
                      style={{ color: "#f59e0b", letterSpacing: "-0.03em" }}
                    >
                      {fmt(totalCasualties)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#555] mt-3">
                      Troops Lost
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Period summaries */}
            <div className="border-t border-[#1a1a1a] pt-8 grid grid-cols-3 gap-8">
              <PeriodBlock
                label="This Week"
                launched={stats.this_week.launched}
                destroyed={stats.this_week.destroyed}
                efficiency={stats.this_week.efficiency}
              />
              <PeriodBlock
                label="This Month"
                launched={stats.this_month.launched}
                destroyed={stats.this_month.destroyed}
                efficiency={stats.this_month.efficiency}
              />
              <PeriodBlock
                label="All Time"
                launched={stats.all_time.launched}
                destroyed={stats.all_time.destroyed}
                efficiency={stats.all_time.efficiency}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
}

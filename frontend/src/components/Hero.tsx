import { useEffect, useState } from "react";
import type { Stats } from "../types";
import { useTranslation } from "../i18n";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import LangToggle from "./LangToggle";

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
  const { t } = useTranslation();
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-3">{label}</div>
      <div className="text-2xl font-black text-white tabular-nums leading-none">{fmt(launched)}</div>
      <div className="text-xs text-[#555] mt-1 mb-2">{t("periodLaunched")}</div>
      <div className="text-sm font-semibold text-[#737373] tabular-nums">
        {fmt(destroyed)} {t("periodIntercepted")}
      </div>
      <div className="text-xs font-bold text-[#ef4444] mt-1">{efficiency}% {t("periodStopped")}</div>
    </div>
  );
}

// ── Live invasion timer ────────────────────────────────────────────────────
const INVASION_START = new Date("2022-02-24T05:00:00+02:00").getTime(); // Kyiv time

function InvasionTicker() {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = now - INVASION_START;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="mt-6 flex items-center gap-3 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#444]">
        {t("heroLiveSince")}
      </span>
      <div className="flex gap-2 tabular-nums">
        {[
          { val: days, label: t("tickerDays") },
          { val: hours, label: t("tickerHours") },
          { val: minutes, label: t("tickerMin") },
          { val: seconds, label: t("tickerSec") },
        ].map(({ val, label }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-lg sm:text-xl font-black text-[#ef4444] leading-none">
              {String(val).padStart(label === t("tickerDays") ? 1 : 2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-[#444] mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hero({ stats, loading, totalCasualties }: Props) {
  const { t } = useTranslation();

  // Animated counters for the big hero numbers
  const animTodayLaunched = useAnimatedCounter(stats?.today.launched ?? 0, 1500);
  const animTotalLaunched = useAnimatedCounter(stats?.all_time.launched ?? 0, 2500);
  const animCasualties = useAnimatedCounter(totalCasualties ?? 0, 2500);

  return (
    <header className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title row */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              {t("heroTitle")}
            </h1>
            <p className="text-[#666] text-sm">
              {t("heroSubtitle")}
              {stats?.all_time && (
                <span className="ml-1">
                  · {stats.all_time.first_date} — {stats.all_time.last_date}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.brighterukraine.org/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#fbbf24] text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#f59e0b] transition-colors"
            >
              {t("donate")}
            </a>
            <LangToggle />
          </div>
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
                  {t("heroRecentAttack")} · {stats.today.date}
                </div>
                <div
                  className="text-[72px] sm:text-[96px] font-black leading-none tabular-nums"
                  style={{ color: "#ef4444", letterSpacing: "-0.03em" }}
                >
                  {fmt(animTodayLaunched)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#555] mt-3">
                  {t("heroMissilesLaunched")}
                </div>
                <div className="flex gap-8 mt-4">
                  <div>
                    <div className="text-2xl font-black text-[#e5e5e5] tabular-nums leading-none">
                      {fmt(stats.today.destroyed)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      {t("heroIntercepted")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#737373] tabular-nums leading-none">
                      {stats.today.efficiency}%
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      {t("heroStopped")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px self-stretch bg-[#1a1a1a]" />

              {/* All-time total */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-[#444] mb-3">
                  {t("heroTotalSince")} {stats.all_time.first_date}
                </div>
                <div
                  className="text-[72px] sm:text-[96px] font-black leading-none tabular-nums"
                  style={{ color: "#e5e5e5", letterSpacing: "-0.03em" }}
                >
                  {fmt(animTotalLaunched)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#555] mt-3">
                  {t("heroMissilesFired")}
                </div>
                <div className="flex gap-8 mt-4">
                  <div>
                    <div className="text-2xl font-black text-[#22c55e] tabular-nums leading-none">
                      {fmt(stats.all_time.destroyed)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      {t("heroIntercepted")}
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-[#737373] tabular-nums leading-none">
                      {stats.all_time.efficiency}%
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mt-1">
                      {t("heroAvgStopped")}
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
                      {t("heroCasualties")}
                    </div>
                    <div
                      className="text-[72px] sm:text-[96px] font-black leading-none tabular-nums"
                      style={{ color: "#f59e0b", letterSpacing: "-0.03em" }}
                    >
                      {fmt(animCasualties)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#555] mt-3">
                      {t("heroTroopsLost")}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live invasion ticker */}
            <InvasionTicker />

            {/* Period summaries */}
            <div className="border-t border-[#1a1a1a] pt-8 mt-6 grid grid-cols-3 gap-8">
              <PeriodBlock
                label={t("periodThisWeek")}
                launched={stats.this_week.launched}
                destroyed={stats.this_week.destroyed}
                efficiency={stats.this_week.efficiency}
              />
              <PeriodBlock
                label={t("periodThisMonth")}
                launched={stats.this_month.launched}
                destroyed={stats.this_month.destroyed}
                efficiency={stats.this_month.efficiency}
              />
              <PeriodBlock
                label={t("periodAllTime")}
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

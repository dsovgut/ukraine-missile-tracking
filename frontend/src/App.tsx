import { lazy, Suspense, useState, useEffect } from "react";
import Hero from "./components/Hero";
import RecordCallout from "./components/RecordCallout";
import PerspectiveSection from "./components/PerspectiveSection";
import MilestoneBanner from "./components/MilestoneBanner";
import CountryCompare from "./components/CountryCompare";
import { useDailyData, useStats, useWeeklyData, useMissileTypes, useByModel } from "./hooks/useData";
import { LanguageProvider, useTranslation } from "./i18n";

// Lazy-load heavy chart components (all depend on ECharts ~420KB)
const TimeSeriesChart = lazy(() => import("./components/TimeSeriesChart"));
const WeeklyBarsChart = lazy(() => import("./components/WeeklyBarsChart"));
const DefenseEfficiency = lazy(() => import("./components/DefenseEfficiency"));
const PatternCharts = lazy(() => import("./components/PatternCharts"));
const PersonnelLosses = lazy(() => import("./components/PersonnelLosses"));
const WeatherScatter = lazy(() => import("./components/WeatherScatter"));
const MissileTypeExplorer = lazy(() => import("./components/MissileTypeExplorer"));

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border border-brand-red border-t-transparent animate-spin" />
    </div>
  );
}

function ChartSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 rounded-full border border-brand-border border-t-brand-red animate-spin" />
    </div>
  );
}

function AppInner() {
  const { t } = useTranslation();
  const { data: stats, loading: statsLoading } = useStats();
  const { data: daily, loading: dailyLoading } = useDailyData();
  const { data: weekly, loading: weeklyLoading } = useWeeklyData();
  const { data: missileTypes, loading: typesLoading } = useMissileTypes();
  const { data: byModel, loading: byModelLoading } = useByModel();

  const chartsLoading = dailyLoading || weeklyLoading || typesLoading || byModelLoading;

  const totalCasualties = daily.reduce((sum: number, d) => sum + (d.personnel_losses ?? 0), 0);

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      <Hero stats={stats} loading={statsLoading} totalCasualties={totalCasualties} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8 pt-8">
        {chartsLoading ? (
          <Spinner />
        ) : (
          <Suspense fallback={<ChartSpinner />}>
            <MilestoneBanner stats={stats} totalCasualties={totalCasualties} />
            <RecordCallout daily={daily} variant="attacks" />
            <TimeSeriesChart data={daily} />
            <PersonnelLosses data={weekly} />
            <PerspectiveSection stats={stats} daily={daily} missileTypes={missileTypes} />
            <CountryCompare stats={stats} />
            <RecordCallout daily={daily} variant="defense" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <WeeklyBarsChart data={weekly} />
              <DefenseEfficiency data={weekly} />
            </div>
            <PatternCharts data={daily} />
            <MissileTypeExplorer types={missileTypes} byModel={byModel} />
            <WeatherScatter data={daily} />
          </Suspense>
        )}
      </main>

      <footer className="border-t border-brand-border py-8 text-center text-brand-text text-sm">
        <p>
          {t("footerData")}{" "}
          <a
            className="text-brand-red hover:opacity-70 transition-opacity"
            href="https://www.kaggle.com/datasets/piterfm/massive-missile-attacks-on-ukraine"
            target="_blank"
            rel="noreferrer"
          >
            Kaggle — piterfm/massive-missile-attacks-on-ukraine
          </a>{" "}
          &amp;{" "}
          <a
            className="text-brand-red hover:opacity-70 transition-opacity"
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo
          </a>
          . {t("footerUpdated")}
        </p>
        <p className="mt-1 text-xs text-brand-muted">{t("footerBuilt")}</p>
      </footer>

      <ScrollToTop />
    </div>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 flex items-center justify-center rounded-full bg-brand-card border border-brand-border text-brand-text hover:text-white hover:border-[#444] hover:bg-[#222] transition-all cursor-pointer shadow-lg"
      aria-label="Scroll to top"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

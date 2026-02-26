import Hero from "./components/Hero";
import TimeSeriesChart from "./components/TimeSeriesChart";
import WeeklyBarsChart from "./components/WeeklyBarsChart";
import DefenseEfficiency from "./components/DefenseEfficiency";
import PatternCharts from "./components/PatternCharts";
import PersonnelLosses from "./components/PersonnelLosses";
import WeatherScatter from "./components/WeatherScatter";
import CumulativeChart from "./components/CumulativeChart";
import MissileTypeExplorer from "./components/MissileTypeExplorer";
import RecordCallout from "./components/RecordCallout";
import PerspectiveSection from "./components/PerspectiveSection";
import { useDailyData, useStats, useWeeklyData, useMissileTypes, useByModel } from "./hooks/useData";
import { LanguageProvider, useTranslation } from "./i18n";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border border-brand-red border-t-transparent animate-spin" />
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

  const totalCasualties = daily.reduce((sum, d) => sum + (d.personnel_losses ?? 0), 0);

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      <Hero stats={stats} loading={statsLoading} totalCasualties={totalCasualties} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8 pt-8">
        {chartsLoading ? (
          <Spinner />
        ) : (
          <>
            <RecordCallout daily={daily} variant="attacks" />
            <PersonnelLosses data={weekly} />
            <PerspectiveSection stats={stats} daily={daily} missileTypes={missileTypes} />
            <CumulativeChart data={daily} />
            <TimeSeriesChart data={daily} />
            <RecordCallout daily={daily} variant="defense" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <WeeklyBarsChart data={weekly} />
              <DefenseEfficiency data={weekly} />
            </div>
            <PatternCharts data={daily} />
            <MissileTypeExplorer types={missileTypes} byModel={byModel} />
            <WeatherScatter data={daily} />
          </>
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
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

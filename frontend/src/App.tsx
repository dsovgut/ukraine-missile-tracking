import Hero from "./components/Hero";
import MissileBreakdown from "./components/MissileBreakdown";
import TimeSeriesChart from "./components/TimeSeriesChart";
import WeeklyBarsChart from "./components/WeeklyBarsChart";
import DefenseEfficiency from "./components/DefenseEfficiency";
import CalendarHeatmap from "./components/CalendarHeatmap";
import PatternCharts from "./components/PatternCharts";
import PersonnelLosses from "./components/PersonnelLosses";
import WeatherScatter from "./components/WeatherScatter";
import { useDailyData, useMissileTypes, useStats, useWeeklyData } from "./hooks/useData";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 rounded-full border-2 border-ukraine-yellow border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  const { data: stats, loading: statsLoading } = useStats();
  const { data: daily, loading: dailyLoading } = useDailyData();
  const { data: weekly, loading: weeklyLoading } = useWeeklyData();
  const { data: types, loading: typesLoading } = useMissileTypes();

  const chartsLoading = dailyLoading || weeklyLoading;

  return (
    <div className="min-h-screen bg-brand-bg font-sans">
      {/* Flag stripe */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #005BBB 50%, #FFD700 50%)" }} />

      <Hero stats={stats} loading={statsLoading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        {typesLoading ? <Spinner /> : <MissileBreakdown types={types} />}

        {chartsLoading ? (
          <Spinner />
        ) : (
          <>
            <TimeSeriesChart data={daily} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <WeeklyBarsChart data={weekly} />
              <DefenseEfficiency data={weekly} />
            </div>
            <CalendarHeatmap data={daily} />
            <PatternCharts data={daily} />
            <PersonnelLosses data={weekly} />
            <WeatherScatter data={daily} />
          </>
        )}
      </main>

      <footer className="border-t border-brand-border py-8 text-center text-brand-text text-sm">
        <p>
          Data:{" "}
          <a className="text-ukraine-blue hover:underline" href="https://www.kaggle.com/datasets/piterfm/massive-missile-attacks-on-ukraine" target="_blank" rel="noreferrer">
            Kaggle — piterfm/massive-missile-attacks-on-ukraine
          </a>{" "}
          &amp;{" "}
          <a className="text-ukraine-blue hover:underline" href="https://open-meteo.com" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
          . Updated daily.
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Built to document the ongoing conflict in Ukraine.{" "}
          <span className="text-ukraine-yellow font-semibold">#StandWithUkraine</span>
        </p>
      </footer>
    </div>
  );
}

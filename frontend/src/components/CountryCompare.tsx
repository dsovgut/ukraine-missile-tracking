import { useState } from "react";
import type { Stats, MissileType } from "../types";
import { estimateTotalMissileCost } from "../data/comparisons";
import { useTranslation } from "../i18n";

interface Props {
  stats: Stats | null;
  missileTypes: MissileType[];
}

// Country data: name, education budget (USD), avg monthly salary, population
// Sources: World Bank, OECD, public budget data (approximate)
const COUNTRIES = [
  { id: "us", name: "United States", flag: "\u{1F1FA}\u{1F1F8}", eduBudget: 800_000_000_000, salary: 4_500, pop: 333_000_000 },
  { id: "uk", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}", eduBudget: 130_000_000_000, salary: 3_200, pop: 67_000_000 },
  { id: "de", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}", eduBudget: 170_000_000_000, salary: 3_800, pop: 84_000_000 },
  { id: "fr", name: "France", flag: "\u{1F1EB}\u{1F1F7}", eduBudget: 120_000_000_000, salary: 3_100, pop: 68_000_000 },
  { id: "pl", name: "Poland", flag: "\u{1F1F5}\u{1F1F1}", eduBudget: 25_000_000_000, salary: 1_500, pop: 38_000_000 },
  { id: "ua", name: "Ukraine (pre-war)", flag: "\u{1F1FA}\u{1F1E6}", eduBudget: 7_000_000_000, salary: 500, pop: 44_000_000 },
  { id: "jp", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}", eduBudget: 80_000_000_000, salary: 2_800, pop: 125_000_000 },
  { id: "br", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}", eduBudget: 50_000_000_000, salary: 600, pop: 214_000_000 },
  { id: "in", name: "India", flag: "\u{1F1EE}\u{1F1F3}", eduBudget: 80_000_000_000, salary: 400, pop: 1_400_000_000 },
  { id: "au", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}", eduBudget: 40_000_000_000, salary: 3_600, pop: 26_000_000 },
  { id: "ca", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}", eduBudget: 65_000_000_000, salary: 3_200, pop: 40_000_000 },
  { id: "kr", name: "South Korea", flag: "\u{1F1F0}\u{1F1F7}", eduBudget: 60_000_000_000, salary: 2_600, pop: 52_000_000 },
];

export default function CountryCompare({ stats, missileTypes }: Props) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!stats) return null;

  const totalCost = estimateTotalMissileCost(missileTypes);
  const costBillions = totalCost / 1_000_000_000;
  const totalLaunched = stats.all_time.launched;

  const selected = COUNTRIES.find((c) => c.id === selectedId);

  return (
    <section className="bg-brand-card border border-brand-border rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-1">{t("compareTitle")}</h2>
      <p className="text-brand-text text-sm mb-5">{t("compareSubtitle")}</p>

      {/* Country selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {COUNTRIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all cursor-pointer ${
              selectedId === c.id
                ? "bg-brand-red/20 border-brand-red text-white font-semibold"
                : "bg-brand-surface border-brand-border text-brand-text hover:border-[#444] hover:text-white"
            }`}
          >
            {c.flag} {c.name}
          </button>
        ))}
      </div>

      {/* Comparison results */}
      {selected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Education budget */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-red mb-2">
              {t("compareEducation")}
            </div>
            <div className="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {(totalCost / selected.eduBudget).toFixed(1)}
              <span className="text-base font-semibold text-brand-text ml-1">{t("compareYears")}</span>
            </div>
            <p className="text-xs text-brand-text leading-snug">
              {t("compareMissileCost")} (${costBillions.toFixed(1)}B) {t("compareCouldFund")} {selected.name}{t("compareEduBudgetFor")} {(totalCost / selected.eduBudget).toFixed(1)} {t("compareYears").toLowerCase()}
            </p>
          </div>

          {/* Per citizen */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b] mb-2">
              {t("comparePerCitizen")}
            </div>
            <div className="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {Math.round(totalLaunched / (selected.pop / 1_000_000)).toLocaleString()}
              <span className="text-base font-semibold text-brand-text ml-1">{t("comparePerMillion")}</span>
            </div>
            <p className="text-xs text-brand-text leading-snug">
              {t("compareMissilesPerMillion")} {selected.name}
            </p>
          </div>

          {/* Salary months */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa] mb-2">
              {t("compareSalary")}
            </div>
            <div className="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {Math.round((totalCost / selected.pop) / selected.salary).toLocaleString()}
              <span className="text-base font-semibold text-brand-text ml-1">{t("compareMonths")}</span>
            </div>
            <p className="text-xs text-brand-text leading-snug">
              {t("compareSalaryExplain")} {selected.name} (${selected.salary.toLocaleString()}/mo)
            </p>
          </div>
        </div>
      )}

      {!selected && (
        <p className="text-brand-muted text-sm italic">{t("comparePrompt")}</p>
      )}
    </section>
  );
}

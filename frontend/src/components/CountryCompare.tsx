import { useState } from "react";
import type { Stats } from "../types";
import { RUSSIA_CUMULATIVE_DEFENSE_SPEND } from "../data/comparisons";
import { useTranslation } from "../i18n";

interface Props {
  stats: Stats | null;
}

// Country data with government & defense budgets (USD, approximate)
// Sources: World Bank, SIPRI, IMF, OECD, official budget data
const COUNTRIES = [
  { id: "us", name: "United States", flag: "\u{1F1FA}\u{1F1F8}", salary: 4_500, pop: 333_000_000, govBudget: 6_100_000_000_000, defenseBudget: 886_000_000_000 },
  { id: "uk", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}", salary: 3_200, pop: 67_000_000, govBudget: 1_200_000_000_000, defenseBudget: 75_000_000_000 },
  { id: "de", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}", salary: 3_800, pop: 84_000_000, govBudget: 2_000_000_000_000, defenseBudget: 67_000_000_000 },
  { id: "fr", name: "France", flag: "\u{1F1EB}\u{1F1F7}", salary: 3_100, pop: 68_000_000, govBudget: 1_600_000_000_000, defenseBudget: 56_000_000_000 },
  { id: "pl", name: "Poland", flag: "\u{1F1F5}\u{1F1F1}", salary: 1_500, pop: 38_000_000, govBudget: 150_000_000_000, defenseBudget: 35_000_000_000 },
  { id: "ua", name: "Ukraine (pre-war)", flag: "\u{1F1FA}\u{1F1E6}", salary: 500, pop: 44_000_000, govBudget: 46_000_000_000, defenseBudget: 6_000_000_000 },
  { id: "jp", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}", salary: 2_800, pop: 125_000_000, govBudget: 940_000_000_000, defenseBudget: 55_000_000_000 },
  { id: "br", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}", salary: 600, pop: 214_000_000, govBudget: 800_000_000_000, defenseBudget: 22_000_000_000 },
  { id: "in", name: "India", flag: "\u{1F1EE}\u{1F1F3}", salary: 400, pop: 1_400_000_000, govBudget: 650_000_000_000, defenseBudget: 74_000_000_000 },
  { id: "au", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}", salary: 3_600, pop: 26_000_000, govBudget: 500_000_000_000, defenseBudget: 32_000_000_000 },
  { id: "ca", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}", salary: 3_200, pop: 40_000_000, govBudget: 400_000_000_000, defenseBudget: 27_000_000_000 },
  { id: "kr", name: "South Korea", flag: "\u{1F1F0}\u{1F1F7}", salary: 2_600, pop: 52_000_000, govBudget: 470_000_000_000, defenseBudget: 47_000_000_000 },
];

const WAR_COST = RUSSIA_CUMULATIVE_DEFENSE_SPEND; // $500B

export default function CountryCompare({ stats }: Props) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!stats) return null;

  const warCostB = WAR_COST / 1_000_000_000;
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
          {/* Government Budget */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-red mb-2">
              {t("compareGovBudget")}
            </div>
            <div className="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {(WAR_COST / selected.govBudget).toFixed(1)}
              <span className="text-base font-semibold text-brand-text ml-1">{t("compareYears")}</span>
            </div>
            <p className="text-xs text-brand-text leading-snug">
              {t("compareWarCost")} (${warCostB.toFixed(0)}B) {t("compareEqualsYears")} {(WAR_COST / selected.govBudget).toFixed(1)} {t("compareYears").toLowerCase()} {t("compareOfGovBudget")} {selected.name}
            </p>
          </div>

          {/* Cost per person */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#f59e0b] mb-2">
              {t("compareWarCostPerPerson")}
            </div>
            <div className="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {Math.round((WAR_COST / selected.pop) / selected.salary).toLocaleString()}
              <span className="text-base font-semibold text-brand-text ml-1">{t("compareMonths")}</span>
            </div>
            <p className="text-xs text-brand-text leading-snug">
              ${Math.round(WAR_COST / selected.pop).toLocaleString()} {t("comparePerPerson")} {selected.name} — {Math.round((WAR_COST / selected.pop) / selected.salary).toLocaleString()} {t("compareMonthsOfWages")} (${selected.salary.toLocaleString()}/mo)
            </p>
          </div>

          {/* Defense budget */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa] mb-2">
              {t("compareDefenseBudget")}
            </div>
            <div className="text-2xl font-black text-white tabular-nums leading-none mb-1">
              {(WAR_COST / selected.defenseBudget).toFixed(1)}×
            </div>
            <p className="text-xs text-brand-text leading-snug">
              {t("compareRussiaSpent")} {(WAR_COST / selected.defenseBudget).toFixed(1)}× {selected.name}{t("compareEntireDefense")}
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

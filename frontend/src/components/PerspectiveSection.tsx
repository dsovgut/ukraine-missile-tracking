import { useState } from "react";
import type { Stats, DailyData, MissileType } from "../types";
import {
  SOVIET_AFGHAN_DEATHS,
  VIETNAM_DEATHS,
  US_IRAQ_DEATHS,
  US_AFGHAN_DEATHS,
  DESERT_STORM_MISSILES,
  IRON_DOME_RATE,
  US_WWII_DAYS,
  SCHOOL_COST_USD,
  HOSPITAL_BED_COST_USD,
  VACCINE_COST_USD,
  estimateTotalMissileCost,
} from "../data/comparisons";
import ShareModal, { type ShareCardData } from "./ShareModal";
import { useTranslation } from "../i18n";

interface Props {
  stats: Stats | null;
  daily: DailyData[];
  missileTypes: MissileType[];
}

interface CardDef {
  id: string;
  eyebrow: string;
  eyebrowColor: string;
  headline: string;
  subtext: string;
  build: () => ShareCardData;
}

export default function PerspectiveSection({ stats, daily, missileTypes }: Props) {
  const { t } = useTranslation();
  const [activeCard, setActiveCard] = useState<ShareCardData | null>(null);

  if (!stats) return null;

  const totalCasualties = daily.reduce((s, d) => s + (d.personnel_losses ?? 0), 0);
  const totalLaunched   = stats.all_time.launched;
  const efficiency      = stats.all_time.efficiency;
  const days            = stats.all_time.days;
  const totalCost       = estimateTotalMissileCost(missileTypes);
  const costBillions    = totalCost / 1_000_000_000;

  // Only render if we have meaningful data
  if (totalCasualties < 100 || totalLaunched < 10) return null;

  // ── Card builders ─────────────────────────────────────────────────────────

  function buildAfghanCard(): ShareCardData {
    const ratio = totalCasualties / SOVIET_AFGHAN_DEATHS;
    return {
      category: "Personnel",
      categoryColor: "#f59e0b",
      headline: `Russia has already lost the equivalent of ${ratio.toFixed(1)}× the entire Soviet-Afghan War`,
      bigNumber: `${ratio.toFixed(1)}×`,
      bigNumberCaption: "Soviet-Afghan Wars worth of Russian deaths",
      comparisonNote:
        "The Soviet-Afghan War (1979–1989) killed ~15,000 Soviet soldiers over 10 years — and helped bring down the USSR. Russia has far exceeded that toll in Ukraine.",
      bars: [
        {
          label: "Russia in Ukraine",
          sublabel: "since Feb 24, 2022",
          value: totalCasualties,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "Soviet-Afghan War",
          sublabel: "1979–1989, 10 years",
          value: SOVIET_AFGHAN_DEATHS,
          color: "#f59e0b",
        },
      ],
      sourceNote:
        "Russia: Ukraine MoD daily reports / Mediazona verified count. Soviet-Afghan: official Soviet records (~14,453; ~15,000 widely cited).",
    };
  }

  function buildPostWWIICard(): ShareCardData {
    const combined = VIETNAM_DEATHS + US_IRAQ_DEATHS + US_AFGHAN_DEATHS;
    return {
      category: "Personnel",
      categoryColor: "#f59e0b",
      headline:
        "Russia has lost more soldiers than the US did in Vietnam, Iraq & Afghanistan — combined",
      bigNumber: totalCasualties.toLocaleString(),
      bigNumberCaption: "estimated Russian soldiers killed",
      comparisonNote: `The US lost ${combined.toLocaleString()} soldiers across all three post-WWII wars spanning 40+ years. Russia has surpassed that in under 4 years.`,
      bars: [
        {
          label: "Russia in Ukraine",
          sublabel: "since Feb 2022",
          value: totalCasualties,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "US Vietnam War",
          sublabel: "1955–1975 · 58,220 deaths",
          value: VIETNAM_DEATHS,
          color: "#f59e0b",
        },
        {
          label: "US Iraq War",
          sublabel: "2003–2011 · 4,431 deaths",
          value: US_IRAQ_DEATHS,
          color: "#a78bfa",
        },
        {
          label: "US Afghanistan",
          sublabel: "2001–2021 · 2,459 deaths",
          value: US_AFGHAN_DEATHS,
          color: "#34d399",
        },
      ],
      sourceNote:
        "Russia: Ukraine MoD / Mediazona. US figures: National Archives DCAS, DoD official records.",
    };
  }

  function buildDesertStormCard(): ShareCardData {
    const ratio = Math.round(totalLaunched / DESERT_STORM_MISSILES);
    return {
      category: "Missiles",
      categoryColor: "#ef4444",
      headline: `Russia has fired ${ratio}× more missiles at Ukraine than the US fired in the entire Gulf War`,
      bigNumber: `${ratio}×`,
      bigNumberCaption: `more than Desert Storm — which fired just ${DESERT_STORM_MISSILES} Tomahawks in 1991`,
      comparisonNote:
        "Operation Desert Storm was considered the most intensive precision missile campaign in modern history — until Ukraine.",
      bars: [
        {
          label: "Russia → Ukraine",
          sublabel: `since Feb 2022 · ${totalLaunched.toLocaleString()} missiles`,
          value: totalLaunched,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "Desert Storm (1991)",
          sublabel: "all cruise missiles fired",
          value: DESERT_STORM_MISSILES,
          color: "#60a5fa",
        },
      ],
      sourceNote:
        "Ukraine data: Kaggle/piterfm (official Ukrainian reports). Desert Storm: US Navy records — 288 TLAMs launched.",
    };
  }

  function buildDollarCostCard(): ShareCardData {
    return {
      category: "Missiles",
      categoryColor: "#ef4444",
      headline: `Russia spent an estimated $${costBillions.toFixed(1)} billion on missiles aimed at Ukraine's civilians`,
      bigNumber: `$${costBillions.toFixed(1)}B`,
      bigNumberCaption: "estimated total cost of missiles fired at Ukraine",
      comparisonNote:
        "Based on conservative Russian domestic procurement pricing per missile type. Real export/replacement costs are 3–6× higher.",
      bars: [],
      sourceNote:
        "Cost per unit: Defence Express / militarnyi.com analysis of leaked Russian MoD procurement contracts. Kalibr ~$1.5M, Kh-101 ~$2M, Shahed ~$30K.",
    };
  }

  function buildWhatCouldBuyCard(): ShareCardData {
    const schools       = Math.round(totalCost / SCHOOL_COST_USD);
    const hospitalBeds  = Math.round(totalCost / HOSPITAL_BED_COST_USD);
    const vaccineMillions = Math.round(totalCost / VACCINE_COST_USD / 1_000_000);
    return {
      category: "Missiles",
      categoryColor: "#ef4444",
      headline: "What Russia's missile spending could have built instead",
      bigNumber: `$${costBillions.toFixed(1)}B`,
      bigNumberCaption: "spent destroying Ukraine's infrastructure",
      comparisonNote: "",
      bars: [],
      bullets: [
        `${schools.toLocaleString()} new schools (at $2M each)`,
        `${(hospitalBeds / 1_000).toFixed(0)},000 hospital beds (at $100K each)`,
        `${vaccineMillions.toLocaleString()} million vaccine doses (UNICEF bulk rate)`,
        `Enough to fund Ukraine's entire pre-war education budget for ${Math.round(totalCost / 7_000_000_000)} years`,
      ],
      sourceNote:
        "School: ~$2M avg (World Bank, Eastern Europe). Hospital bed: ~$100K. Vaccines: $3/dose (UNICEF COVAX). Ukraine education budget: ~$7B/yr pre-war.",
    };
  }

  function buildIronDomeCard(): ShareCardData {
    return {
      category: "Defense",
      categoryColor: "#22c55e",
      headline: `Ukraine intercepts ${efficiency.toFixed(1)}% of missiles — matching Iron Dome under far greater pressure`,
      bigNumber: `${efficiency.toFixed(1)}%`,
      bigNumberCaption: "of all Russian missiles and drones intercepted",
      comparisonNote:
        "Iron Dome operates in short bursts. Ukraine has maintained these rates under relentless, large-scale attacks for years — making it the most battle-tested air defense system in history.",
      bars: [
        {
          label: "Ukraine Air Defense",
          sublabel: "since Feb 2022 · sustained campaign",
          value: Math.round(efficiency),
          color: "#22c55e",
          isHighlight: true,
        },
        {
          label: "Iron Dome (Israel)",
          sublabel: "IDF official average",
          value: IRON_DOME_RATE,
          color: "#60a5fa",
        },
      ],
      sourceNote:
        "Ukraine: Kaggle/piterfm (official Ukrainian MoD data). Iron Dome: IDF official figure (~90% across all operations).",
    };
  }

  function buildDurationCard(): ShareCardData {
    const moreDays = days - US_WWII_DAYS;
    return {
      category: "Timeline",
      categoryColor: "#60a5fa",
      headline: `${days.toLocaleString()} days — the invasion has lasted longer than US involvement in World War II`,
      bigNumber: days.toLocaleString(),
      bigNumberCaption: "days since the full-scale invasion began (Feb 24, 2022)",
      comparisonNote:
        moreDays > 0
          ? `That is ${moreDays} days longer than the entire US involvement in WWII (Dec 7, 1941 – Aug 15, 1945).`
          : `US involvement in WWII lasted ${US_WWII_DAYS.toLocaleString()} days. Ukraine is rapidly approaching that milestone.`,
      bars: [
        {
          label: "Russia's invasion of Ukraine",
          sublabel: "Feb 24, 2022 – present",
          value: days,
          color: "#60a5fa",
          isHighlight: true,
        },
        {
          label: "US involvement in WWII",
          sublabel: "Dec 7, 1941 – Aug 15, 1945",
          value: US_WWII_DAYS,
          color: "#f59e0b",
        },
      ],
      sourceNote: "US WWII: Dec 7, 1941 – Aug 15, 1945 = 1,347 days. Invasion start: Feb 24, 2022.",
    };
  }

  // ── Card grid definitions ─────────────────────────────────────────────────

  const cards: CardDef[] = [
    {
      id: "afghan",
      eyebrow: "Personnel",
      eyebrowColor: "#f59e0b",
      headline: `${(totalCasualties / SOVIET_AFGHAN_DEATHS).toFixed(1)}× the Soviet-Afghan War`,
      subtext: `${totalCasualties.toLocaleString()} Russian losses vs. 15,000 over 10 years`,
      build: buildAfghanCard,
    },
    {
      id: "postWWII",
      eyebrow: "Personnel",
      eyebrowColor: "#f59e0b",
      headline: "More than all US post-WWII wars combined",
      subtext: `Vietnam + Iraq + Afghanistan = ${(VIETNAM_DEATHS + US_IRAQ_DEATHS + US_AFGHAN_DEATHS).toLocaleString()} — already surpassed`,
      build: buildPostWWIICard,
    },
    {
      id: "duration",
      eyebrow: "Timeline",
      eyebrowColor: "#60a5fa",
      headline: `${days.toLocaleString()} days`,
      subtext: `Longer than US involvement in WWII (${US_WWII_DAYS.toLocaleString()} days)`,
      build: buildDurationCard,
    },
    {
      id: "desertStorm",
      eyebrow: "Missiles",
      eyebrowColor: "#ef4444",
      headline: `${Math.round(totalLaunched / DESERT_STORM_MISSILES)}× Desert Storm`,
      subtext: `${totalLaunched.toLocaleString()} missiles vs. just ${DESERT_STORM_MISSILES} in the Gulf War`,
      build: buildDesertStormCard,
    },
    {
      id: "cost",
      eyebrow: "Missiles",
      eyebrowColor: "#ef4444",
      headline: `$${costBillions.toFixed(1)} billion in missiles`,
      subtext: "Conservative estimated cost targeting civilian infrastructure",
      build: buildDollarCostCard,
    },
    {
      id: "couldBuy",
      eyebrow: "Missiles",
      eyebrowColor: "#ef4444",
      headline: `${Math.round(totalCost / SCHOOL_COST_USD).toLocaleString()} schools`,
      subtext: "What the same money could have built instead",
      build: buildWhatCouldBuyCard,
    },
    {
      id: "ironDome",
      eyebrow: "Defense",
      eyebrowColor: "#22c55e",
      headline: `${efficiency.toFixed(1)}% — matching Iron Dome`,
      subtext: "The most battle-tested air defense system in history",
      build: buildIronDomeCard,
    },
  ];

  return (
    <>
      <section className="bg-brand-card border border-brand-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">{t("perspectiveTitle")}</h2>
        <p className="text-brand-text text-sm mb-6">{t("perspectiveSubtitle")}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setActiveCard(card.build())}
              className="text-left bg-brand-surface border border-brand-border rounded-xl p-4 hover:border-[#333] hover:bg-[#161616] transition-all group cursor-pointer"
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: card.eyebrowColor }}
              >
                {card.eyebrow}
              </span>
              <p className="text-white font-bold text-sm mt-1 mb-2 leading-snug">
                {card.headline}
              </p>
              <p className="text-brand-text text-xs leading-snug">{card.subtext}</p>
              <p className="text-[10px] text-brand-muted mt-3 group-hover:text-[#666] transition-colors">
                View &amp; Share ↗
              </p>
            </button>
          ))}
        </div>
      </section>

      {activeCard && (
        <ShareModal card={activeCard} onClose={() => setActiveCard(null)} />
      )}
    </>
  );
}

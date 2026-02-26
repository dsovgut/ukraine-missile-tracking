import { useState, useRef, useEffect, useCallback } from "react";
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
  AVG_MISSILE_WARHEAD_KG,
  AVG_DRONE_WARHEAD_KG,
  HIROSHIMA_YIELD_KT,
  SHOCK_AND_AWE_MISSILES,
  RUSSIA_CUMULATIVE_DEFENSE_SPEND,
  ISS_COST,
  RUSSIA_DEFENSE_BUDGET_SHARE,
  RUSSIA_POPULATION,
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
  isHero?: boolean;
}

export default function PerspectiveSection({ stats, daily, missileTypes }: Props) {
  const { t } = useTranslation();
  const [activeCard, setActiveCard] = useState<ShareCardData | null>(null);
  const [, setActiveCardId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeDot, setActiveDot] = useState(0);
  const deepLinkHandled = useRef(false);

  if (!stats) return null;

  const totalCasualties = daily.reduce((s, d) => s + (d.personnel_losses ?? 0), 0);
  const totalLaunched   = stats.all_time.launched;
  const totalDestroyed  = stats.all_time.destroyed;
  const efficiency      = stats.all_time.efficiency;
  const days            = stats.all_time.days;
  const totalCost       = estimateTotalMissileCost(missileTypes);
  const costBillions    = totalCost / 1_000_000_000;

  // Estimate drone count (Shahed types)
  const droneTypes = missileTypes.filter(
    (m) => m.model.toLowerCase().includes("shahed") || m.model.toLowerCase().includes("drone"),
  );
  const totalDrones = droneTypes.reduce((s, m) => s + m.total_launched, 0);
  const totalMissilesOnly = totalLaunched - totalDrones;

  // Explosive yield estimate (kilotons)
  const missilePayloadTons = (totalMissilesOnly * AVG_MISSILE_WARHEAD_KG) / 1000;
  const dronePayloadTons = (totalDrones * AVG_DRONE_WARHEAD_KG) / 1000;
  const totalPayloadKt = (missilePayloadTons + dronePayloadTons) / 1000;
  const hiroshimaFraction = totalPayloadKt / HIROSHIMA_YIELD_KT;

  // Russia war economy
  const issEquivalent = Math.round(RUSSIA_CUMULATIVE_DEFENSE_SPEND / ISS_COST);
  const costPerCitizen = Math.round(RUSSIA_CUMULATIVE_DEFENSE_SPEND / RUSSIA_POPULATION);

  // Only render if we have meaningful data
  if (totalCasualties < 100 || totalLaunched < 10) return null;

  // ── Card builders ─────────────────────────────────────────────────────────

  function buildTotalMissilesHeroCard(): ShareCardData {
    const missileRate = Math.round(totalLaunched / days);
    return {
      category: "Overview",
      categoryColor: "#ef4444",
      headline: `${totalLaunched.toLocaleString()} missiles and drones fired at Ukraine — the most intense aerial bombardment of the 21st century`,
      bigNumber: totalLaunched.toLocaleString(),
      bigNumberCaption: `missiles & drones launched since Feb 24, 2022 (~${missileRate}/day)`,
      comparisonNote: `Of these, ${totalDestroyed.toLocaleString()} (${efficiency.toFixed(1)}%) were intercepted by Ukraine's air defense — the most battle-tested system in history. The remaining ${(totalLaunched - totalDestroyed).toLocaleString()} struck Ukrainian cities, homes, hospitals, and energy infrastructure.`,
      bars: [
        {
          label: "Total Launched",
          sublabel: `${totalLaunched.toLocaleString()} missiles & drones`,
          value: totalLaunched,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "Intercepted",
          sublabel: `${efficiency.toFixed(1)}% stopped`,
          value: totalDestroyed,
          color: "#22c55e",
        },
        {
          label: "Got Through",
          sublabel: "struck targets across Ukraine",
          value: totalLaunched - totalDestroyed,
          color: "#f59e0b",
        },
      ],
      sourceNote:
        "Data: Ukrainian Air Force official reports via Kaggle/piterfm. Updated daily.",
    };
  }

  function buildExplosiveYieldHeroCard(): ShareCardData {
    return {
      category: "Explosive Scale",
      categoryColor: "#f97316",
      headline: `~${totalPayloadKt.toFixed(1)} kilotons of explosives rained on Ukraine — nearly ${(hiroshimaFraction * 100).toFixed(0)}% of Hiroshima`,
      bigNumber: `${totalPayloadKt.toFixed(1)} kt`,
      bigNumberCaption: "estimated total explosive payload delivered to Ukraine",
      comparisonNote:
        `The atomic bomb dropped on Hiroshima had a yield of about ${HIROSHIMA_YIELD_KT} kilotons. Russia has delivered roughly ${(hiroshimaFraction * 100).toFixed(0)}% of that explosive power — distributed conventionally, city block by city block, day after day, over ${days.toLocaleString()} days.`,
      bars: [
        {
          label: "Russia → Ukraine (conventional)",
          sublabel: `${totalPayloadKt.toFixed(1)} kt over ${days.toLocaleString()} days`,
          value: Math.round(totalPayloadKt * 1000),
          color: "#f97316",
          isHighlight: true,
        },
        {
          label: "Hiroshima (atomic)",
          sublabel: "single detonation, Aug 6 1945",
          value: HIROSHIMA_YIELD_KT * 1000,
          color: "#a78bfa",
        },
      ],
      sourceNote:
        "Estimate: avg cruise/ballistic warhead ~500 kg, Shahed ~45 kg. Hiroshima: ~15 kilotons yield. Note: conventional vs nuclear yield is not directly comparable but illustrates industrial scale.",
    };
  }

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

  function buildShockAndAweCard(): ShareCardData {
    const ratio = Math.round(totalLaunched / SHOCK_AND_AWE_MISSILES);
    return {
      category: "Missiles",
      categoryColor: "#ef4444",
      headline: `${ratio}× the "Shock and Awe" campaign — Russia has fired ${totalLaunched.toLocaleString()} missiles vs 800 in Iraq 2003`,
      bigNumber: `${ratio}×`,
      bigNumberCaption: "more than the entire 2003 Iraq 'Shock and Awe' campaign",
      comparisonNote:
        "During the highly publicized 'Shock and Awe' campaign in the opening weeks of the 2003 Iraq War, the US and allies fired roughly 800 Tomahawk cruise missiles. Russia surpassed that in the first months of 2022 and has since fired more than twelve times that amount.",
      bars: [
        {
          label: "Russia → Ukraine",
          sublabel: `since Feb 2022 · ${totalLaunched.toLocaleString()} total`,
          value: totalLaunched,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "Shock & Awe (Iraq 2003)",
          sublabel: `~${SHOCK_AND_AWE_MISSILES} Tomahawks`,
          value: SHOCK_AND_AWE_MISSILES,
          color: "#60a5fa",
        },
      ],
      sourceNote:
        "Ukraine: official Ukrainian Air Force reports. Iraq 2003: US DoD public records — ~800 TLAMs in opening weeks.",
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

  function buildDefenseEconomicsCard(): ShareCardData {
    return {
      category: "Defense",
      categoryColor: "#22c55e",
      headline: "Shooting a Ferrari to destroy a Honda Civic — the insane asymmetry of air defense costs",
      bigNumber: "100×",
      bigNumberCaption: "cost disparity: a $35K drone vs $3M+ interceptor",
      comparisonNote:
        "A Shahed drone costs Russia ~$35,000 to build. A NASAMS or Patriot missile to shoot it down costs $1–4 million. Kinzhal hypersonic missiles ($10M+) require multiple Patriot interceptors ($8M+). Ukraine has adapted by using heavy machine guns and electronic warfare where possible, but the financial strain is immense.",
      bars: [
        {
          label: "Patriot Interceptor",
          sublabel: "cost to shoot down one missile",
          value: 4_000_000,
          color: "#22c55e",
          isHighlight: true,
        },
        {
          label: "Shahed Drone",
          sublabel: "cost for Russia to launch",
          value: 35_000,
          color: "#ef4444",
        },
      ],
      bullets: [
        "Shahed drone: ~$35K to fire → $1M–$4M to intercept",
        "Kh-101 cruise missile: ~$1.5M → $3M–$4M Patriot interceptor",
        "Kinzhal hypersonic: ~$10M+ → $8M+ (multiple Patriots)",
      ],
      sourceNote:
        "Defence Express, militarnyi.com, official Western procurement data. Patriot: US Army/Raytheon public pricing.",
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

  function buildWarEconomyCard(): ShareCardData {
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `~$${(RUSSIA_CUMULATIVE_DEFENSE_SPEND / 1e9).toFixed(0)}B spent on war — enough to build ${issEquivalent} International Space Stations`,
      bigNumber: `$${(RUSSIA_CUMULATIVE_DEFENSE_SPEND / 1e9).toFixed(0)}B`,
      bigNumberCaption: "total Russian military spending since Feb 2022",
      comparisonNote:
        `The ISS — one of the most expensive engineering projects in human history, built by a coalition of nations over a decade — cost ~$150B. Russia has spent enough on this war to build ${issEquivalent} of them. Defense spending hit $140B+ in 2024, up from $53B pre-war.`,
      bars: [
        {
          label: "Russia war spending",
          sublabel: "2022–2025 cumulative",
          value: RUSSIA_CUMULATIVE_DEFENSE_SPEND / 1e6,
          color: "#a78bfa",
          isHighlight: true,
        },
        {
          label: "International Space Station",
          sublabel: "total construction cost",
          value: ISS_COST / 1e6,
          color: "#60a5fa",
        },
      ],
      sourceNote:
        "Russian defense budget: SIPRI, official Russian federal budget documents. ISS cost: NASA (~$150B).",
    };
  }

  function buildWelfareVsWarfareCard(): ShareCardData {
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `${RUSSIA_DEFENSE_BUDGET_SHARE}% of Russia's budget goes to military — more than education, healthcare & social policy combined`,
      bigNumber: `${RUSSIA_DEFENSE_BUDGET_SHARE}%`,
      bigNumberCaption: "of the Russian federal budget on defense",
      comparisonNote:
        "For the first time in modern Russian history, the Kremlin is spending more on the military and security than on education, healthcare, social policy, and the national economy combined. They are literally trading the future education of their youth and health of their aging population for artillery shells.",
      bars: [
        {
          label: "Military & Security",
          sublabel: "32% of federal budget",
          value: 32,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "Education + Health + Social",
          sublabel: "combined, less than defense",
          value: 28,
          color: "#22c55e",
        },
      ],
      sourceNote:
        "Russian federal budget 2024–2025: official government data, Reuters/TASS reporting.",
    };
  }

  function buildGhostEconomyCard(): ShareCardData {
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `$1.6 trillion in lost GDP — Russia destroyed an economy the size of Spain`,
      bigNumber: "$1.6T",
      bigNumberCaption: "estimated cumulative lost GDP from war & sanctions",
      comparisonNote:
        "$1.6 trillion is larger than the entire GDP of countries like Spain or Australia. By starting this war, Russia essentially set fire to an entire top-20 global economy in terms of lost economic potential.",
      bars: [
        {
          label: "Russia's lost GDP",
          sublabel: "cumulative lost potential (2022–2025)",
          value: 1600,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "Spain's GDP",
          sublabel: "for comparison (~$1.4T)",
          value: 1400,
          color: "#60a5fa",
        },
        {
          label: "Australia's GDP",
          sublabel: "for comparison (~$1.5T)",
          value: 1500,
          color: "#f59e0b",
        },
      ],
      sourceNote:
        "Lost GDP estimates: Yale School of Management, Bloomberg Economics. GDP figures: World Bank 2024.",
    };
  }

  function buildCostPerCitizenCard(): ShareCardData {
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `~$${costPerCitizen.toLocaleString()} spent per Russian citizen on this war — months of wages outside Moscow`,
      bigNumber: `$${costPerCitizen.toLocaleString()}`,
      bigNumberCaption: "military spending per Russian citizen (man, woman & child)",
      comparisonNote:
        "In a country where the average monthly salary in many regions is well under $1,000, the government has burned through months of a citizen's wages per person — prioritizing territorial expansion over poverty alleviation.",
      bars: [
        {
          label: "War cost per citizen",
          sublabel: `$${costPerCitizen.toLocaleString()} per 144M people`,
          value: costPerCitizen,
          color: "#ef4444",
          isHighlight: true,
        },
        {
          label: "Average monthly salary",
          sublabel: "outside Moscow, ~$700-900",
          value: 800,
          color: "#22c55e",
        },
      ],
      sourceNote:
        "Population: 144M (Rosstat). Defense spending: ~$500B (SIPRI/official). Salary: Rosstat regional avg.",
    };
  }

  // ── Card grid definitions ─────────────────────────────────────────────────

  const cards: CardDef[] = [
    // Hero cards (first two — bigger)
    {
      id: "totalMissiles",
      eyebrow: "Overview",
      eyebrowColor: "#ef4444",
      headline: `${totalLaunched.toLocaleString()} missiles & drones`,
      subtext: `The most intense aerial bombardment of the 21st century. ${efficiency.toFixed(1)}% intercepted. ~${Math.round(totalLaunched / days)}/day average.`,
      build: buildTotalMissilesHeroCard,
      isHero: true,
    },
    {
      id: "explosiveYield",
      eyebrow: "Explosive Scale",
      eyebrowColor: "#f97316",
      headline: `~${totalPayloadKt.toFixed(1)} kilotons on Ukraine`,
      subtext: `Nearly ${(hiroshimaFraction * 100).toFixed(0)}% of the Hiroshima bomb's yield — delivered conventionally, block by block, over ${days.toLocaleString()} days.`,
      build: buildExplosiveYieldHeroCard,
      isHero: true,
    },
    // Regular perspective cards
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
      id: "shockAndAwe",
      eyebrow: "Missiles",
      eyebrowColor: "#ef4444",
      headline: `${Math.round(totalLaunched / SHOCK_AND_AWE_MISSILES)}× "Shock and Awe"`,
      subtext: `Russia surpassed the entire 2003 Iraq War's 800 Tomahawks in the first months`,
      build: buildShockAndAweCard,
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
      id: "defenseCost",
      eyebrow: "Defense",
      eyebrowColor: "#22c55e",
      headline: "Ferrari vs Honda Civic",
      subtext: "A $35K drone requires a $3M+ Patriot to intercept — the insane asymmetry of air defense",
      build: buildDefenseEconomicsCard,
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
    {
      id: "warEconomy",
      eyebrow: "Economy",
      eyebrowColor: "#a78bfa",
      headline: `$${(RUSSIA_CUMULATIVE_DEFENSE_SPEND / 1e9).toFixed(0)}B = ${issEquivalent} Space Stations`,
      subtext: "Russia has spent enough on this war to build 3 International Space Stations",
      build: buildWarEconomyCard,
    },
    {
      id: "welfareWarfare",
      eyebrow: "Economy",
      eyebrowColor: "#a78bfa",
      headline: `${RUSSIA_DEFENSE_BUDGET_SHARE}% on warfare`,
      subtext: "Russia spends more on military than education, health & social combined",
      build: buildWelfareVsWarfareCard,
    },
    {
      id: "ghostEconomy",
      eyebrow: "Economy",
      eyebrowColor: "#a78bfa",
      headline: "$1.6T in lost GDP",
      subtext: "Russia destroyed an economy larger than Spain's in lost potential",
      build: buildGhostEconomyCard,
    },
    {
      id: "costPerCitizen",
      eyebrow: "Economy",
      eyebrowColor: "#a78bfa",
      headline: `$${costPerCitizen.toLocaleString()} per citizen`,
      subtext: "Months of wages outside Moscow spent per Russian on this war",
      build: buildCostPerCitizenCard,
    },
  ];

  // ── Carousel logic ──────────────────────────────────────────────────────

  // Group cards into pages for dots (approx)
  const totalCards = cards.length;

  /* eslint-disable react-hooks/rules-of-hooks */
  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);

    // Calculate active dot (approximate card index)
    if (el.children.length > 0) {
      const firstChild = el.children[0] as HTMLElement;
      const cardWidth = firstChild.offsetWidth + 16; // gap
      const idx = Math.round(scrollLeft / cardWidth);
      setActiveDot(Math.min(idx, totalCards - 1));
    }
  }, [totalCards]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);
  // Deep-link: auto-open card from URL hash (e.g. #card=explosiveYield)
  useEffect(() => {
    if (deepLinkHandled.current) return;
    const hash = window.location.hash;
    const match = hash.match(/^#card=(.+)$/);
    if (match) {
      const card = cards.find((c) => c.id === match[1]);
      if (card) {
        deepLinkHandled.current = true;
        setActiveCardId(card.id);
        setActiveCard(card.build());
      }
    }
  }, [cards]);
  /* eslint-enable react-hooks/rules-of-hooks */

  function openCard(card: CardDef) {
    setActiveCardId(card.id);
    setActiveCard(card.build());
    window.history.replaceState(null, "", `#card=${card.id}`);
  }

  function closeCard() {
    setActiveCardId(null);
    setActiveCard(null);
    window.history.replaceState(null, "", window.location.pathname);
  }

  function scrollBy(direction: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }

  function scrollToDot(idx: number) {
    const el = trackRef.current;
    if (!el || !el.children[idx]) return;
    const child = el.children[idx] as HTMLElement;
    el.scrollTo({
      left: child.offsetLeft - 16,
      behavior: "smooth",
    });
  }

  // Show a subset of dots (max ~8) to avoid visual clutter
  const dotStep = totalCards > 10 ? 2 : 1;
  const dotIndices: number[] = [];
  for (let i = 0; i < totalCards; i += dotStep) {
    dotIndices.push(i);
  }
  if (dotIndices[dotIndices.length - 1] !== totalCards - 1) {
    dotIndices.push(totalCards - 1);
  }

  return (
    <>
      <section className="bg-brand-card border border-brand-border rounded-xl p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-1">{t("perspectiveTitle")}</h2>
        <p className="text-brand-text text-sm mb-6">{t("perspectiveSubtitle")}</p>

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scrollBy("left")}
              className="carousel-arrow carousel-arrow--left hidden sm:flex"
              aria-label="Scroll left"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scrollBy("right")}
              className="carousel-arrow carousel-arrow--right hidden sm:flex"
              aria-label="Scroll right"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* Scrollable track */}
          <div ref={trackRef} className="carousel-track">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => openCard(card)}
                className={`carousel-card ${
                  card.isHero ? "carousel-card--hero" : "carousel-card--regular"
                } text-left bg-brand-surface border border-brand-border rounded-xl hover:border-[#333] hover:bg-[#161616] transition-all group cursor-pointer ${
                  card.isHero ? "p-5" : "p-4"
                }`}
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: card.eyebrowColor }}
                >
                  {card.eyebrow}
                </span>
                <p className={`text-white font-bold mt-1 mb-2 leading-snug ${
                  card.isHero ? "text-base" : "text-sm"
                }`}>
                  {card.headline}
                </p>
                <p className={`text-brand-text leading-snug ${
                  card.isHero ? "text-sm" : "text-xs"
                }`}>
                  {card.subtext}
                </p>
                <p className="text-[10px] text-brand-muted mt-3 group-hover:text-[#666] transition-colors">
                  View &amp; Share ↗
                </p>
              </button>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="carousel-dots">
            {dotIndices.map((idx) => {
              const isActive =
                activeDot === idx ||
                (dotStep > 1 && activeDot >= idx && activeDot < (dotIndices[dotIndices.indexOf(idx) + 1] ?? totalCards));
              return (
                <button
                  key={idx}
                  className={`carousel-dot ${isActive ? "carousel-dot--active" : ""}`}
                  onClick={() => scrollToDot(idx)}
                  aria-label={`Go to card ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {activeCard && (
        <ShareModal card={activeCard} onClose={closeCard} />
      )}
    </>
  );
}

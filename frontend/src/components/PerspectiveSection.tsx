import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Stats, DailyData, MissileType } from "../types";
import {
  VIETNAM_DEATHS,
  US_IRAQ_DEATHS,
  US_AFGHAN_DEATHS,
  IRON_DOME_RATE,
  US_WWII_DAYS,
  RUSSIA_CUMULATIVE_DEFENSE_SPEND,
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const deepLinkHandled = useState(false);

  if (!stats) return null;

  const totalCasualties = daily.reduce((s, d) => s + (d.personnel_losses ?? 0), 0);
  const totalLaunched   = stats.all_time.launched;
  const totalDestroyed  = stats.all_time.destroyed;
  const efficiency      = stats.all_time.efficiency;
  const totalCost       = estimateTotalMissileCost(missileTypes);
  const costBillions    = totalCost / 1_000_000_000;

  // Real days since Feb 24, 2022 (full-scale invasion start)
  const INVASION_START = new Date("2022-02-24T00:00:00Z").getTime();
  const days = Math.floor((Date.now() - INVASION_START) / (86_400_000));

  // Russia war economy
  const costPerCitizen = Math.round(RUSSIA_CUMULATIVE_DEFENSE_SPEND / RUSSIA_POPULATION);

  // Daily average for context
  const avgPerDay = Math.round(totalLaunched / days);

  // Best defense day (100% or highest interception rate with significant volume)
  const attackDays = daily.filter((d) => d.launched >= 20);
  const bestDefenseDay = attackDays.length > 0
    ? attackDays.reduce((best, d) => {
        const rate = d.destroyed / d.launched;
        const bestRate = best.destroyed / best.launched;
        return rate > bestRate ? d : best;
      }, attackDays[0])
    : null;

  // Only render if we have meaningful data
  if (totalCasualties < 100 || totalLaunched < 10) return null;

  // ── Card builders ─────────────────────────────────────────────────────────

  function buildTodayAttackCard(): ShareCardData {
    const todayLaunched = stats!.today.launched;
    const todayDestroyed = stats!.today.destroyed;
    const todayEff = stats!.today.efficiency;
    return {
      category: "Live Data",
      categoryColor: "#ef4444",
      headline: todayLaunched > 0
        ? `${todayLaunched} missiles & drones launched at Ukraine today — ${todayDestroyed} intercepted (${todayEff.toFixed(0)}%)`
        : `No attacks reported today — but ${totalLaunched.toLocaleString()} have been fired since Feb 24, 2022`,
      bigNumber: todayLaunched > 0 ? todayLaunched.toLocaleString() : "0",
      bigNumberCaption: todayLaunched > 0
        ? `missiles & drones launched today (daily avg: ~${avgPerDay})`
        : `attacks today — daily average is ~${avgPerDay}`,
      comparisonNote: todayLaunched > 0
        ? `Today's attack is ${todayLaunched > avgPerDay ? `${((todayLaunched / avgPerDay) * 100 - 100).toFixed(0)}% above` : `${((1 - todayLaunched / avgPerDay) * 100).toFixed(0)}% below`} the daily average of ~${avgPerDay} missiles/drones. Total since Feb 24, 2022: ${totalLaunched.toLocaleString()}.`
        : `The average day sees ~${avgPerDay} missiles and drones fired at Ukraine. Total since Feb 24, 2022: ${totalLaunched.toLocaleString()}.`,
      bars: todayLaunched > 0
        ? [
            { label: "Launched Today", sublabel: `${todayLaunched} missiles & drones`, value: todayLaunched, color: "#ef4444", isHighlight: true },
            { label: "Intercepted", sublabel: `${todayEff.toFixed(0)}% stopped`, value: todayDestroyed, color: "#22c55e" },
            { label: "Daily Average", sublabel: `~${avgPerDay}/day since Feb 2022`, value: avgPerDay, color: "#60a5fa" },
          ]
        : [
            { label: "All-Time Launched", sublabel: `since Feb 24, 2022`, value: totalLaunched, color: "#ef4444", isHighlight: true },
            { label: "Daily Average", sublabel: `~${avgPerDay}/day`, value: avgPerDay, color: "#60a5fa" },
          ],
      sourceNote: "Data: Ukrainian Air Force official reports via Kaggle/piterfm. Updated daily.",
    };
  }

  function buildWeekSummaryCard(): ShareCardData {
    const weekLaunched = stats!.this_week.launched;
    const weekDestroyed = stats!.this_week.destroyed;
    const weekEff = stats!.this_week.efficiency;
    return {
      category: "Live Data",
      categoryColor: "#ef4444",
      headline: `${weekLaunched} missiles & drones this week — ${weekEff.toFixed(0)}% intercepted. ${totalLaunched.toLocaleString()} total since the invasion began.`,
      bigNumber: weekLaunched.toLocaleString(),
      bigNumberCaption: `attacks this week (${totalLaunched.toLocaleString()} all-time)`,
      comparisonNote: `Ukraine's air defense intercepted ${weekDestroyed} of ${weekLaunched} missiles and drones this week (${weekEff.toFixed(1)}%). Since February 24, 2022, a total of ${totalLaunched.toLocaleString()} missiles and drones have been launched — averaging ~${avgPerDay} per day over ${days.toLocaleString()} days.`,
      bars: [
        { label: "This Week", sublabel: `${weekLaunched} launched`, value: weekLaunched, color: "#ef4444", isHighlight: true },
        { label: "Intercepted", sublabel: `${weekEff.toFixed(0)}% stopped`, value: weekDestroyed, color: "#22c55e" },
        { label: "All-Time Total", sublabel: `${totalLaunched.toLocaleString()} since Feb 2022`, value: totalLaunched, color: "#60a5fa" },
      ],
      sourceNote: "Data: Ukrainian Air Force official reports via Kaggle/piterfm. Updated daily.",
    };
  }

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
        { label: "Total Launched", sublabel: `${totalLaunched.toLocaleString()} missiles & drones`, value: totalLaunched, color: "#ef4444", isHighlight: true },
        { label: "Intercepted", sublabel: `${efficiency.toFixed(1)}% stopped`, value: totalDestroyed, color: "#22c55e" },
        { label: "Got Through", sublabel: "struck targets across Ukraine", value: totalLaunched - totalDestroyed, color: "#f59e0b" },
      ],
      sourceNote: "Data: Ukrainian Air Force official reports via Kaggle/piterfm. Updated daily.",
    };
  }

  function buildPostWWIICard(): ShareCardData {
    const combined = VIETNAM_DEATHS + US_IRAQ_DEATHS + US_AFGHAN_DEATHS;
    return {
      category: "Personnel",
      categoryColor: "#f59e0b",
      headline: "Russia has lost more soldiers than the US did in Vietnam, Iraq & Afghanistan — combined",
      bigNumber: totalCasualties.toLocaleString(),
      bigNumberCaption: "estimated Russian soldiers killed",
      comparisonNote: `The US lost ${combined.toLocaleString()} soldiers across all three post-WWII wars spanning 40+ years. Russia has surpassed that in under 4 years.`,
      bars: [
        { label: "Russia in Ukraine", sublabel: "since Feb 2022", value: totalCasualties, color: "#ef4444", isHighlight: true },
        { label: "US Vietnam War", sublabel: "1955–1975 · 58,220 deaths", value: VIETNAM_DEATHS, color: "#f59e0b" },
        { label: "US Iraq War", sublabel: "2003–2011 · 4,431 deaths", value: US_IRAQ_DEATHS, color: "#a78bfa" },
        { label: "US Afghanistan", sublabel: "2001–2021 · 2,459 deaths", value: US_AFGHAN_DEATHS, color: "#34d399" },
      ],
      sourceNote: "Russia: Ukraine MoD / Mediazona. US figures: National Archives DCAS, DoD official records.",
    };
  }

  function buildDollarCostCard(): ShareCardData {
    const homes = Math.round(totalCost / 250_000);
    return {
      category: "Missiles",
      categoryColor: "#ef4444",
      headline: `$${costBillions.toFixed(1)} billion in missiles — enough to build the James Webb Space Telescope and still have change`,
      bigNumber: `$${costBillions.toFixed(1)}B`,
      bigNumberCaption: "estimated total cost of missiles fired at Ukraine",
      comparisonNote: "Based on conservative Russian domestic procurement pricing. Real replacement costs are 3–6× higher.",
      bars: [],
      bullets: [
        `**The James Webb Space Telescope** — the most powerful space telescope ever built, 30 years in development — cost **~$10B**. You could build it from scratch and still have **$${(totalCost / 1e9 - 10).toFixed(1)}B left over**.`,
        `**Two Large Hadron Colliders** — the world's largest particle accelerator that discovered the Higgs boson — cost ~$4.75B each. You could build two and still have **~$${(totalCost / 1e9 - 9.5).toFixed(1)}B to spare**.`,
        `**Fund the global fight against malaria for two years** — the WHO estimates $5–6B/year to fund bed nets, treatments, and vaccines worldwide.`,
        `**${homes.toLocaleString()} affordable homes** at $250K each — enough to house **~${Math.round(homes * 2.2 / 1000) * 1000} people** and end homelessness in several major cities.`,
      ],
      sourceNote: "Missile costs: Defence Express / militarnyi.com. JWST: NASA ($10B). LHC: CERN ($4.75B). Malaria: WHO Global Malaria Programme. Housing: US avg affordable housing cost.",
    };
  }

  function buildIronDomeCard(): ShareCardData {
    return {
      category: "Defense",
      categoryColor: "#22c55e",
      headline: `${efficiency.toFixed(1)}% interception against the most complex aerial threats ever faced — no system on Earth has been tested like this`,
      bigNumber: `${efficiency.toFixed(1)}%`,
      bigNumberCaption: "of all Russian missiles and drones intercepted",
      comparisonNote: `Iron Dome intercepts ~90% of short-range rockets in brief bursts lasting minutes. Ukraine's air defense faces cruise missiles, ballistic missiles, hypersonic weapons, and swarms of drones simultaneously — sustained over ${days.toLocaleString()} days. Maintaining ${efficiency.toFixed(1)}% against this threat diversity and volume is unprecedented. No other air defense system in history has been tested at this scale and complexity.`,
      bars: [
        { label: "Ukraine Air Defense", sublabel: `${days.toLocaleString()} days · cruise, ballistic, hypersonic, drones`, value: Math.round(efficiency), color: "#22c55e", isHighlight: true },
        { label: "Iron Dome (Israel)", sublabel: "short-range rockets · brief engagements", value: IRON_DOME_RATE, color: "#60a5fa" },
      ],
      sourceNote: "Ukraine: Kaggle/piterfm (official Ukrainian MoD data). Iron Dome: IDF official figure (~90%). Threat complexity is not directly comparable — Ukraine faces far more diverse and advanced weapon types.",
    };
  }

  function buildBestDefenseDayCard(): ShareCardData {
    if (!bestDefenseDay) {
      return {
        category: "Defense",
        categoryColor: "#22c55e",
        headline: "Insufficient data for best defense day",
        bigNumber: "—",
        bigNumberCaption: "",
        comparisonNote: "",
        bars: [],
        sourceNote: "",
      };
    }
    const rate = Math.round((bestDefenseDay.destroyed / bestDefenseDay.launched) * 100);
    const dateStr = new Date(bestDefenseDay.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return {
      category: "Defense",
      categoryColor: "#22c55e",
      headline: `${rate}% of all missiles stopped in a single day — ${bestDefenseDay.launched} launched, ${bestDefenseDay.destroyed} intercepted`,
      bigNumber: `${rate}%`,
      bigNumberCaption: `interception rate on ${dateStr}`,
      comparisonNote: `On ${dateStr}, Russia launched ${bestDefenseDay.launched} missiles and drones at Ukraine. Ukraine's air defense intercepted ${bestDefenseDay.destroyed} of them — a ${rate}% success rate. This is among the most effective single-day air defense performances in modern warfare.`,
      bars: [
        { label: "Launched", sublabel: `${bestDefenseDay.launched} missiles & drones`, value: bestDefenseDay.launched, color: "#ef4444", isHighlight: true },
        { label: "Intercepted", sublabel: `${rate}% stopped`, value: bestDefenseDay.destroyed, color: "#22c55e" },
        { label: "Got Through", sublabel: "reached their targets", value: bestDefenseDay.launched - bestDefenseDay.destroyed, color: "#f59e0b" },
      ],
      sourceNote: "Data: Ukrainian Air Force official reports via Kaggle/piterfm.",
    };
  }

  function buildDurationCard(): ShareCardData {
    const moreDays = days - US_WWII_DAYS;
    const isLonger = moreDays > 0;
    return {
      category: "Timeline",
      categoryColor: "#60a5fa",
      headline: isLonger
        ? `${days.toLocaleString()} days — the full-scale invasion has lasted longer than US involvement in World War II`
        : `${days.toLocaleString()} days and counting — the full-scale invasion is approaching the length of US involvement in WWII`,
      bigNumber: days.toLocaleString(),
      bigNumberCaption: "days since Russia's full-scale invasion began (Feb 24, 2022)",
      comparisonNote: isLonger
        ? `That is ${moreDays} days longer than the entire US involvement in WWII (Dec 7, 1941 – Aug 15, 1945).`
        : `US involvement in WWII lasted ${US_WWII_DAYS.toLocaleString()} days. The full-scale invasion of Ukraine has already lasted ${days.toLocaleString()} days — just ${US_WWII_DAYS - days} days short of that grim milestone.`,
      bars: [
        { label: "Full-scale invasion of Ukraine", sublabel: "Feb 24, 2022 – present", value: days, color: "#60a5fa", isHighlight: true },
        { label: "US involvement in WWII", sublabel: "Dec 7, 1941 – Aug 15, 1945", value: US_WWII_DAYS, color: "#f59e0b" },
      ],
      sourceNote: "US WWII: Dec 7, 1941 – Aug 15, 1945 = 1,347 days. Full-scale invasion: Feb 24, 2022.",
    };
  }

  function buildWarEconomyCard(): ShareCardData {
    const warSpendB = RUSSIA_CUMULATIVE_DEFENSE_SPEND / 1e9;
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `~$${warSpendB.toFixed(0)}B spent on war — enough to end extreme world hunger for a decade`,
      bigNumber: `$${warSpendB.toFixed(0)}B`,
      bigNumberCaption: "total Russian military spending since Feb 2022",
      comparisonNote: "This is 'start a new civilization' money. Instead, it was spent on destruction.",
      bars: [],
      bullets: [
        `**End extreme world hunger for a decade** — the UN estimates $39–50B/year to end hunger and malnutrition globally. $${warSpendB.toFixed(0)}B could foot the bill for **the entire planet for 10 straight years**.`,
        `**Provide clean water for the world** for 4–5 years — the World Bank estimates $114B/year for universal safe drinking water and sanitation. $${warSpendB.toFixed(0)}B could **solve the global water crisis** for half a decade.`,
        `**Build a permanent Moon colony** — NASA's entire Apollo program cost ~$257B (inflation-adjusted). For $${warSpendB.toFixed(0)}B, you could **fund Apollo twice**, or build and sustain a permanent lunar research colony for decades.`,
      ],
      sourceNote: "Russian defense spending: SIPRI, official Russian federal budget. Hunger: UN/FAO. Water: World Bank. Apollo: NASA inflation-adjusted estimates.",
    };
  }

  function buildWelfareVsWarfareCard(): ShareCardData {
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `${RUSSIA_DEFENSE_BUDGET_SHARE}% of Russia's budget goes to military — more than education, healthcare & social policy combined`,
      bigNumber: `${RUSSIA_DEFENSE_BUDGET_SHARE}%`,
      bigNumberCaption: "of the Russian federal budget on defense",
      comparisonNote: "For the first time in modern Russian history, the Kremlin is spending more on the military and security than on education, healthcare, social policy, and the national economy combined. They are literally trading the future education of their youth and health of their aging population for artillery shells.",
      bars: [
        { label: "Military & Security", sublabel: "32% of federal budget", value: 32, color: "#ef4444", isHighlight: true },
        { label: "Education + Health + Social", sublabel: "combined, less than defense", value: 28, color: "#22c55e" },
      ],
      sourceNote: "Russian federal budget 2024–2025: official government data, Reuters/TASS reporting.",
    };
  }

  function buildGhostEconomyCard(): ShareCardData {
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `$1.6 trillion in lost GDP — Russia destroyed an economy the size of Spain`,
      bigNumber: "$1.6T",
      bigNumberCaption: "estimated cumulative lost GDP from war & sanctions",
      comparisonNote: "$1.6 trillion is larger than the entire GDP of countries like Spain or Australia. By starting this war, Russia essentially set fire to an entire top-20 global economy in terms of lost economic potential.",
      bars: [
        { label: "Russia's lost GDP", sublabel: "cumulative lost potential (2022–2025)", value: 1600, color: "#ef4444", isHighlight: true },
        { label: "Spain's GDP", sublabel: "for comparison (~$1.4T)", value: 1400, color: "#60a5fa" },
        { label: "Australia's GDP", sublabel: "for comparison (~$1.5T)", value: 1500, color: "#f59e0b" },
      ],
      sourceNote: "Lost GDP estimates: Yale School of Management, Bloomberg Economics. GDP figures: World Bank 2024.",
    };
  }

  function buildCostPerCitizenCard(): ShareCardData {
    return {
      category: "Economy",
      categoryColor: "#a78bfa",
      headline: `~$${costPerCitizen.toLocaleString()} spent per Russian citizen on this war — months of wages outside Moscow`,
      bigNumber: `$${costPerCitizen.toLocaleString()}`,
      bigNumberCaption: "military spending per Russian citizen (man, woman & child)",
      comparisonNote: "In a country where the average monthly salary in many regions is well under $1,000, the government has burned through months of a citizen's wages per person — prioritizing territorial expansion over poverty alleviation.",
      bars: [
        { label: "War cost per citizen", sublabel: `$${costPerCitizen.toLocaleString()} per 144M people`, value: costPerCitizen, color: "#ef4444", isHighlight: true },
        { label: "Average monthly salary", sublabel: "outside Moscow, ~$700-900", value: 800, color: "#22c55e" },
      ],
      sourceNote: "Population: 144M (Rosstat). Defense spending: ~$500B (SIPRI/official). Salary: Rosstat regional avg.",
    };
  }

  // ── Card grid definitions ─────────────────────────────────────────────────

  const cards: CardDef[] = [
    {
      id: "todayAttack",
      eyebrow: "Live Data",
      eyebrowColor: "#ef4444",
      headline: stats.today.launched > 0
        ? `${stats.today.launched} attacks today`
        : "No attacks reported today",
      subtext: stats.today.launched > 0
        ? `${stats.today.destroyed} intercepted (${stats.today.efficiency.toFixed(0)}% stopped). Updated from Ukrainian Air Force reports.`
        : `Daily average: ~${avgPerDay} missiles & drones. ${totalLaunched.toLocaleString()} total since Feb 24, 2022.`,
      build: buildTodayAttackCard,
      isHero: true,
    },
    {
      id: "warEconomy",
      eyebrow: "Economy",
      eyebrowColor: "#a78bfa",
      headline: `$${(RUSSIA_CUMULATIVE_DEFENSE_SPEND / 1e9).toFixed(0)}B — could end world hunger for a decade`,
      subtext: "Or provide clean water globally for 5 years. Or build a permanent Moon colony.",
      build: buildWarEconomyCard,
    },
    {
      id: "weekSummary",
      eyebrow: "Live Data",
      eyebrowColor: "#ef4444",
      headline: `${stats.this_week.launched} attacks this week`,
      subtext: `${stats.this_week.efficiency.toFixed(0)}% interception rate. ${totalLaunched.toLocaleString()} total since Feb 24, 2022.`,
      build: buildWeekSummaryCard,
      isHero: true,
    },
    {
      id: "totalMissiles",
      eyebrow: "Overview",
      eyebrowColor: "#ef4444",
      headline: `${totalLaunched.toLocaleString()} missiles & drones`,
      subtext: `The most intense aerial bombardment of the 21st century. ${efficiency.toFixed(1)}% intercepted. ~${avgPerDay}/day average.`,
      build: buildTotalMissilesHeroCard,
      isHero: true,
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
      headline: `${days.toLocaleString()} days and counting`,
      subtext: days > US_WWII_DAYS
        ? `Now longer than US involvement in WWII (${US_WWII_DAYS.toLocaleString()} days)`
        : `Approaching US involvement in WWII (${US_WWII_DAYS.toLocaleString()} days) — just ${US_WWII_DAYS - days} days away`,
      build: buildDurationCard,
    },
    {
      id: "cost",
      eyebrow: "Missiles",
      eyebrowColor: "#ef4444",
      headline: `$${costBillions.toFixed(1)}B in missiles — or a James Webb Telescope`,
      subtext: "What Russia spent destroying Ukraine could have built humanity's greatest scientific instruments",
      build: buildDollarCostCard,
    },
    {
      id: "ironDome",
      eyebrow: "Defense",
      eyebrowColor: "#22c55e",
      headline: `${efficiency.toFixed(1)}% against the most complex threats ever`,
      subtext: "No air defense system in history has been tested at this scale and threat diversity",
      build: buildIronDomeCard,
    },
    ...(bestDefenseDay ? [{
      id: "bestDefense",
      eyebrow: "Defense",
      eyebrowColor: "#22c55e",
      headline: `Best defense day: ${Math.round((bestDefenseDay.destroyed / bestDefenseDay.launched) * 100)}% stopped`,
      subtext: `${bestDefenseDay.launched} missiles launched, ${bestDefenseDay.destroyed} intercepted on ${new Date(bestDefenseDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      build: buildBestDefenseDayCard,
    }] as CardDef[] : []),
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

  // ── Derive unique categories for filter pills ─────────────────────────────
  const categories = useMemo(() => {
    const seen = new Set<string>();
    return cards.reduce<{ name: string; color: string }[]>((acc, c) => {
      if (!seen.has(c.eyebrow)) {
        seen.add(c.eyebrow);
        acc.push({ name: c.eyebrow, color: c.eyebrowColor });
      }
      return acc;
    }, []);
  }, [cards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation ────────────────────────────────────────────────────────────

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCards = activeCategory
    ? cards.filter((c) => c.eyebrow === activeCategory)
    : cards;

  // Clamp currentIndex when filteredCards changes
  const safeIndex = Math.min(currentIndex, filteredCards.length - 1);
  const currentCard = filteredCards[safeIndex];

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, filteredCards.length - 1));
  }, [filteredCards.length]);

  // Keyboard navigation
  /* eslint-disable react-hooks/rules-of-hooks */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (activeCard) return; // don't navigate while modal is open
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext, activeCard]);

  // Swipe / drag support (touch + mouse)
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  function handlePointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    didSwipe.current = false;
  }
  function handlePointerUp(e: React.PointerEvent) {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx)) return;
    didSwipe.current = true;
    if (dx < 0) { goNext(); setHasInteracted(true); }
    else { goPrev(); setHasInteracted(true); }
  }
  function handleCardClick() {
    if (didSwipe.current) { didSwipe.current = false; return; }
    if (currentCard) { openCard(currentCard); setHasInteracted(true); }
  }

  // Track first interaction to dismiss hint
  const [hasInteracted, setHasInteracted] = useState(() => {
    try { return localStorage.getItem("perspective-interacted") === "1"; } catch { return false; }
  });
  useEffect(() => {
    if (hasInteracted) {
      try { localStorage.setItem("perspective-interacted", "1"); } catch { /* noop */ }
    }
  }, [hasInteracted]);

  // Deep-link
  useEffect(() => {
    if (deepLinkHandled[0]) return;
    const hash = window.location.hash;
    const match = hash.match(/^#card=(.+)$/);
    if (match) {
      const idx = cards.findIndex((c) => c.id === match[1]);
      if (idx >= 0) {
        deepLinkHandled[1](true);
        setCurrentIndex(idx);
        setActiveCard(cards[idx].build());
      }
    }
  }, [cards.length]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/rules-of-hooks */

  function openCard(card: CardDef) {
    setActiveCard(card.build());
    window.history.replaceState(null, "", `#card=${card.id}`);
  }

  function closeCard() {
    setActiveCard(null);
    window.history.replaceState(null, "", window.location.pathname);
  }

  // ── Render mini bar preview ──────────────────────────────────────────────
  function renderMiniBars(card: CardDef) {
    const data = card.build();
    if (!data.bars || data.bars.length === 0) return null;
    const bars = data.bars.slice(0, 3);
    const maxVal = Math.max(...bars.map((b) => b.value));
    return (
      <div className="flex flex-col gap-2 mt-4">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className={bar.isHighlight ? "text-white font-semibold" : "text-brand-text"}>
                {bar.label}
              </span>
              <span className="text-brand-text tabular-nums">{bar.value.toLocaleString()}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(bar.value / maxVal) * 100}%`,
                  background: bar.color,
                  opacity: bar.isHighlight ? 1 : 0.5,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progress = filteredCards.length > 1 ? safeIndex / (filteredCards.length - 1) : 1;

  return (
    <>
      <section className="bg-brand-card border border-brand-border rounded-xl p-6">
        {/* Header with counter */}
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-xl font-bold text-white">{t("perspectiveTitle")}</h2>
          <span className="text-sm text-brand-text tabular-nums whitespace-nowrap ml-4">
            {safeIndex + 1} / {filteredCards.length}
          </span>
        </div>
        <p className="text-brand-text text-sm mb-4">{t("perspectiveSubtitle")}</p>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-[#1a1a1a] mb-5 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-red transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => { setActiveCategory(null); setCurrentIndex(0); }}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
              activeCategory === null
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-brand-border text-brand-text hover:border-[#444] hover:text-white"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setActiveCategory(activeCategory === cat.name ? null : cat.name); setCurrentIndex(0); }}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                activeCategory === cat.name
                  ? "border-white/20 text-white"
                  : "bg-transparent border-brand-border text-brand-text hover:border-[#444] hover:text-white"
              }`}
              style={activeCategory === cat.name ? { background: cat.color + "22", borderColor: cat.color + "44" } : undefined}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Current card */}
        {currentCard && (
          <div
            ref={cardContainerRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="touch-pan-y select-none"
          >
            <button
              onClick={handleCardClick}
              className="w-full text-left bg-brand-surface border rounded-xl p-6 sm:p-8 hover:border-[#333] hover:bg-[#161616] transition-all group cursor-pointer relative animate-card-glow"
              style={{ borderColor: currentCard.eyebrowColor + "44" }}
            >
              {/* Share pill */}
              <span className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-[10px] font-semibold uppercase tracking-wider group-hover:bg-[#005BBB] group-hover:text-white transition-all">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                Share
              </span>

              {/* Eyebrow */}
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: currentCard.eyebrowColor }}
              >
                {currentCard.eyebrow}
              </span>

              {/* Headline */}
              <p className="text-white font-bold text-xl sm:text-2xl leading-snug mb-3 pr-16">
                {currentCard.headline}
              </p>

              {/* Subtext */}
              <p className="text-brand-text text-sm sm:text-base leading-relaxed mb-2">
                {currentCard.subtext}
              </p>

              {/* Mini bar preview */}
              {renderMiniBars(currentCard)}

              {/* Tap to expand */}
              <div className="flex items-center justify-center gap-1.5 mt-5 pt-4 border-t border-brand-border/50 animate-tap-cta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 animate-bounce-gentle">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wider">Tap to expand</span>
              </div>
            </button>
          </div>
        )}

        {/* Swipe hint */}
        {!hasInteracted && filteredCards.length > 1 && (
          <p className="text-center text-brand-muted text-xs mt-3 animate-fade-in-out">
            Swipe or tap to explore &amp; share
          </p>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => { goPrev(); setHasInteracted(true); }}
            disabled={safeIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border text-brand-text hover:border-[#444] hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Prev
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5">
            {filteredCards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  i === safeIndex ? "bg-brand-red scale-125" : "bg-[#333] hover:bg-[#555]"
                }`}
                aria-label={`Go to card ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => { goNext(); setHasInteracted(true); }}
            disabled={safeIndex >= filteredCards.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-brand-border text-brand-text hover:border-[#444] hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      {activeCard && (
        <ShareModal card={activeCard} onClose={closeCard} />
      )}
    </>
  );
}

import { createContext, useCallback, useContext, useState } from "react";

export type Lang = "en" | "uk";

const translations = {
  en: {
    // Hero
    heroTitle: "Ukraine Missile Tracker",
    heroSubtitle: "Documenting Russian missile and drone attacks on Ukraine",
    heroRecentAttack: "Most recent attack",
    heroMissilesLaunched: "Missiles Launched",
    heroIntercepted: "Intercepted",
    heroStopped: "Stopped",
    heroTotalSince: "Total since",
    heroMissilesFired: "Missiles Fired at Ukraine",
    heroAvgStopped: "Avg stopped",
    heroCasualties: "Russian casualties",
    heroTroopsLost: "Troops Lost",
    heroLiveSince: "Full-scale invasion",
    tickerDays: "days",
    tickerHours: "hrs",
    tickerMin: "min",
    tickerSec: "sec",
    // Share
    shareSaveImage: "Save Image",
    shareSaving: "Saving…",
    shareClose: "Close",
    shareTwitter: "Post on X",
    shareTelegram: "Telegram",
    shareCopyLink: "Copy Link",
    shareCopied: "Copied!",
    shareScreenshot: "Or just screenshot this card to share",
    shareNative: "Share",
    shareEmbed: "Embed",
    shareEmbedCopied: "Embed code copied!",
    // Milestones
    milestonePrefix: "Grim milestone:",
    milestoneMissiles: "missiles & drones fired at Ukraine",
    milestoneCasualties: "Russian troops lost",
    periodThisWeek: "This Week",
    periodThisMonth: "This Month",
    periodAllTime: "All Time",
    periodLaunched: "launched",
    periodIntercepted: "intercepted",
    periodStopped: "stopped",
    // RecordCallout
    recordAttack: "Record attack",
    recordMissiles: "missiles",
    recordLongestPause: "Longest pause",
    recordDaysSilence: "days silence",
    recordEnded: "ended",
    recordBestDefense: "Best defense day",
    recordPctStopped: "% stopped",
    recordMostIntercepted: "Most intercepted",
    recordInOneDay: "in one day",
    // PersonnelLosses
    personnelTitle: "Russian Personnel Losses",
    personnelSubtitle: "Weekly reported Russian personnel casualties with 4-week rolling average.",
    personnelWeeklyLosses: "Weekly Losses",
    personnel4WeekAvg: "4-week Avg",
    personnelPersonnel: "Personnel",
    personnelWeekOf: "Week of",
    personnelLossesLabel: "Losses:",
    personnel4wkAvgLabel: "4-wk avg:",
    // CumulativeChart
    cumulativeTitle: "Cumulative Scale",
    cumulativeTotalLaunched: "Total Launched",
    cumulativeTotalIntercepted: "Total Intercepted",
    cumulativeGotThrough: "Got Through",
    cumulativeLaunchedLabel: "Launched:",
    cumulativeInterceptedLabel: "Intercepted:",
    cumulativeGotThroughLabel: "Got through:",
    // TimeSeriesChart
    timeseriesTitle: "Attack Timeline",
    timeseriesLaunchedDaily: "Launched (daily)",
    timeseriesInterceptedDaily: "Intercepted (daily)",
    timeseriesLaunched7d: "Launched (7-day avg)",
    timeseriesIntercepted7d: "Intercepted (7-day avg)",
    timeseriesMissiles: "Missiles",
    // WeeklyBarsChart
    weeklyTitle: "Weekly Attack Volume",
    weeklySubtitle: "Stacked bars show how many were intercepted (green) vs reached their target (red).",
    weeklyIntercepted: "Intercepted",
    weeklyGotThrough: "Got through",
    weeklyWeekOf: "Week of",
    weeklyLaunchedLabel: "Launched:",
    weeklyInterceptedLabel: "Intercepted:",
    weeklyGotThroughLabel: "Got through:",
    weeklyRateLabel: "Rate:",
    weeklyMissiles: "Missiles",
    // DefenseEfficiency
    defenseTitle: "Defense Efficiency",
    defenseSubtitle: "Weekly interception rate (%) with overall average (dashed) and trend line.",
    defenseEfficiency: "Efficiency",
    defenseTrend: "Trend",
    defenseWeekOf: "Week of",
    defenseEfficiencyLabel: "Efficiency:",
    defenseTrendLabel: "Trend:",
    // PatternCharts
    patternTitle: "Attack Patterns",
    patternSubtitle:
      "Average missiles launched per day, broken down by month and day of week (days with 0 attacks excluded).",
    patternByMonth: "By Month",
    patternByDay: "By Day of Week",
    patternMonthAxisLabel: "Month",
    patternDayAxisLabel: "Day",
    patternAvgLaunches: "Avg launches",
    patternAvg: "Avg:",
    patternMissilesUnit: "missiles",
    // WeatherScatter
    weatherTitle: "Weather vs Attacks",
    weatherSubtitle:
      "Each dot is one day. Dashed line shows the linear trend. Correlation is generally weak — attacks follow strategic, not weather-driven, patterns.",
    weatherTemp: "Temperature",
    weatherPrecip: "Precipitation",
    weatherWind: "Wind Speed",
    weatherCloud: "Cloud Cover",
    weatherLaunchedLabel: "Launched:",
    // MissileTypeExplorer
    missileTitle: "Missile & Drone Types",
    missileSubtitleAll:
      "All weapon types ranked by total launches. Click a type to see its monthly history.",
    missileSubtitleSelectedPrefix: "Monthly usage history for",
    missileSubtitleSelectedSuffix: '. Click another type or "All" to compare.',
    missileAllTypes: "All Types",
    missileTotalLaunched: "Total launched",
    missileIntercepted: "Intercepted",
    missileGotThrough: "Got through",
    missileEfficiency: "Efficiency",
    missileLaunchedLabel: "Launched:",
    missileInterceptedLabel: "Intercepted:",
    missileGotThroughLabel: "Got through:",
    missileEfficiencyLabel: "Efficiency:",
    // PerspectiveSection
    perspectiveTitle: "In Perspective",
    perspectiveSubtitle: "Click through the cards — tap any to view full details and share.",
    // CountryCompare
    compareTitle: "Compare to Your Country",
    compareSubtitle: "Select a country to see how Russia's $500B war spending compares.",
    compareGovBudget: "Government budget",
    compareYears: "years",
    compareWarCost: "Russia's war spending",
    compareEqualsYears: "equals",
    compareOfGovBudget: "of the entire government budget of",
    compareWarCostPerPerson: "War cost per person",
    compareMonths: "months",
    comparePerPerson: "per person in",
    compareMonthsOfWages: "months of wages",
    compareDefenseBudget: "Defense budget",
    compareRussiaSpent: "Russia spent",
    compareEntireDefense: "'s entire annual military budget",
    comparePrompt: "Select a country above to see personalized comparisons.",
    // Footer
    footerData: "Data:",
    footerUpdated: "Updated daily.",
    footerBuilt: "Built to document the ongoing conflict in Ukraine. #StandWithUkraine",
    // Donate
    donate: "Donate",
  },
  uk: {
    // Hero
    heroTitle: "Трекер ракетних ударів по Україні",
    heroSubtitle: "Документування російських ракетних і дронових атак на Україну",
    heroRecentAttack: "Остання атака",
    heroMissilesLaunched: "Запущено ракет",
    heroIntercepted: "Перехоплено",
    heroStopped: "Знищено",
    heroTotalSince: "Усього з",
    heroMissilesFired: "Ракет по Україні",
    heroAvgStopped: "Сер. знищено",
    heroCasualties: "Втрати Росії",
    heroTroopsLost: "Загинуло військових",
    heroLiveSince: "Повномасштабне вторгнення",
    tickerDays: "дн",
    tickerHours: "год",
    tickerMin: "хв",
    tickerSec: "сек",
    // Share
    shareSaveImage: "Зберегти",
    shareSaving: "Збереження…",
    shareClose: "Закрити",
    shareTwitter: "X (Twitter)",
    shareTelegram: "Telegram",
    shareCopyLink: "Копіювати",
    shareCopied: "Скопійовано!",
    shareScreenshot: "Або зробіть скріншот цієї картки для поширення",
    shareNative: "Поширити",
    shareEmbed: "Вбудувати",
    shareEmbedCopied: "Код вбудовування скопійовано!",
    // Milestones
    milestonePrefix: "Сумний рубіж:",
    milestoneMissiles: "ракет та дронів запущено по Україні",
    milestoneCasualties: "втрати російських військ",
    periodThisWeek: "Цей тиждень",
    periodThisMonth: "Цей місяць",
    periodAllTime: "За весь час",
    periodLaunched: "запущено",
    periodIntercepted: "перехоплено",
    periodStopped: "знищено",
    // RecordCallout
    recordAttack: "Рекордна атака",
    recordMissiles: "ракет",
    recordLongestPause: "Найдовша пауза",
    recordDaysSilence: "днів тиші",
    recordEnded: "закінчилась",
    recordBestDefense: "Найкращий день захисту",
    recordPctStopped: "% знищено",
    recordMostIntercepted: "Найбільше перехоплено",
    recordInOneDay: "за один день",
    // PersonnelLosses
    personnelTitle: "Втрати особового складу Росії",
    personnelSubtitle:
      "Щотижневі підтверджені втрати особового складу Росії із 4-тижневим ковзним середнім.",
    personnelWeeklyLosses: "Тижневі втрати",
    personnel4WeekAvg: "4-тижн. серед.",
    personnelPersonnel: "Особовий склад",
    personnelWeekOf: "Тиждень:",
    personnelLossesLabel: "Втрати:",
    personnel4wkAvgLabel: "4-тижн. серед.:",
    // CumulativeChart
    cumulativeTitle: "Кумулятивна шкала",
    cumulativeTotalLaunched: "Всього запущено",
    cumulativeTotalIntercepted: "Всього перехоплено",
    cumulativeGotThrough: "Досягло цілі",
    cumulativeLaunchedLabel: "Запущено:",
    cumulativeInterceptedLabel: "Перехоплено:",
    cumulativeGotThroughLabel: "Досягло:",
    // TimeSeriesChart
    timeseriesTitle: "Хронологія атак",
    timeseriesLaunchedDaily: "Запущено (щодня)",
    timeseriesInterceptedDaily: "Перехоплено (щодня)",
    timeseriesLaunched7d: "Запущено (7-ден. сер.)",
    timeseriesIntercepted7d: "Перехоплено (7-ден. сер.)",
    timeseriesMissiles: "Ракети",
    // WeeklyBarsChart
    weeklyTitle: "Тижневий обсяг атак",
    weeklySubtitle:
      "Стовпці показують кількість перехоплених (зелені) та тих, що досягли цілей (червоні).",
    weeklyIntercepted: "Перехоплено",
    weeklyGotThrough: "Досягло цілей",
    weeklyWeekOf: "Тиждень:",
    weeklyLaunchedLabel: "Запущено:",
    weeklyInterceptedLabel: "Перехоплено:",
    weeklyGotThroughLabel: "Досягло:",
    weeklyRateLabel: "Ефект.:",
    weeklyMissiles: "Ракети",
    // DefenseEfficiency
    defenseTitle: "Ефективність ПРО",
    defenseSubtitle:
      "Щотижневий відсоток перехоплення (%) із загальним середнім (пунктир) та лінією тренду.",
    defenseEfficiency: "Ефективність",
    defenseTrend: "Тренд",
    defenseWeekOf: "Тиждень:",
    defenseEfficiencyLabel: "Ефективність:",
    defenseTrendLabel: "Тренд:",
    // PatternCharts
    patternTitle: "Закономірності атак",
    patternSubtitle:
      "Середня кількість ракет за день за місяцем та днем тижня (дні без атак виключені).",
    patternByMonth: "За місяцем",
    patternByDay: "За днем тижня",
    patternMonthAxisLabel: "Місяць",
    patternDayAxisLabel: "День",
    patternAvgLaunches: "Сер. запусків",
    patternAvg: "Сер.:",
    patternMissilesUnit: "ракет",
    // WeatherScatter
    weatherTitle: "Погода та атаки",
    weatherSubtitle:
      "Кожна точка — один день. Пунктир — лінійний тренд. Кореляція слабка — атаки залежать від стратегії, а не погоди.",
    weatherTemp: "Температура",
    weatherPrecip: "Опади",
    weatherWind: "Швидкість вітру",
    weatherCloud: "Хмарність",
    weatherLaunchedLabel: "Запущено:",
    // MissileTypeExplorer
    missileTitle: "Типи ракет та дронів",
    missileSubtitleAll:
      "Всі типи зброї, відсортовані за кількістю запусків. Натисніть на тип для перегляду місячної динаміки.",
    missileSubtitleSelectedPrefix: "Місячна динаміка для",
    missileSubtitleSelectedSuffix: ". Натисніть інший тип або «Всі типи» для порівняння.",
    missileAllTypes: "Всі типи",
    missileTotalLaunched: "Всього запущено",
    missileIntercepted: "Перехоплено",
    missileGotThrough: "Досягло цілей",
    missileEfficiency: "Ефективність",
    missileLaunchedLabel: "Запущено:",
    missileInterceptedLabel: "Перехоплено:",
    missileGotThroughLabel: "Досягло:",
    missileEfficiencyLabel: "Ефективність:",
    // PerspectiveSection
    perspectiveTitle: "У контексті",
    perspectiveSubtitle: "Гортайте картки — натисніть, щоб переглянути деталі та поділитися.",
    // CountryCompare
    compareTitle: "Порівняйте зі своєю країною",
    compareSubtitle: "Оберіть країну, щоб побачити, як $500 млрд витрат Росії на війну порівнюються.",
    compareGovBudget: "Державний бюджет",
    compareYears: "років",
    compareWarCost: "Витрати Росії на війну",
    compareEqualsYears: "дорівнює",
    compareOfGovBudget: "повного державного бюджету",
    compareWarCostPerPerson: "Вартість війни на людину",
    compareMonths: "місяців",
    comparePerPerson: "на людину в",
    compareMonthsOfWages: "місяців зарплати",
    compareDefenseBudget: "Оборонний бюджет",
    compareRussiaSpent: "Росія витратила",
    compareEntireDefense: " усього річного військового бюджету",
    comparePrompt: "Оберіть країну вище, щоб побачити персоналізовані порівняння.",
    // Footer
    footerData: "Дані:",
    footerUpdated: "Оновлюється щодня.",
    footerBuilt: "Створено для документування триваючого конфлікту в Україні. #СлаваУкраїні",
    // Donate
    donate: "Допомогти",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

// Localised month/day name arrays (used by PatternCharts)
export const MONTH_NAMES: Record<Lang, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  uk: ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"],
};

export const DAY_NAMES: Record<Lang, string[]> = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  uk: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface I18nContext {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const Ctx = createContext<I18nContext>({
  lang: "en",
  setLang: () => {},
  t: (k) => translations.en[k],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("lang") as Lang) ?? "en";
    } catch {
      return "en";
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  };

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key],
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useTranslation() {
  return useContext(Ctx);
}

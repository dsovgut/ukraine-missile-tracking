import type { MissileType } from "../types";

// ─── Historical war deaths ────────────────────────────────────────────────────
// Sources: US National Archives, DoD DCAS, official Soviet records, Wikipedia
export const SOVIET_AFGHAN_DEATHS = 15_000;   // ~14,453 official; ~15,000 widely cited
export const VIETNAM_DEATHS       = 58_220;   // US National Archives, exact DoD count
export const US_IRAQ_DEATHS       = 4_431;    // DoD DCAS, Operation Iraqi Freedom
export const US_AFGHAN_DEATHS     = 2_459;    // DoD, Operation Enduring/Freedom's Sentinel

// ─── Missile reference ────────────────────────────────────────────────────────
// Source: US Navy records — 288 TLAMs launched in Desert Storm (1991)
export const DESERT_STORM_MISSILES = 288;

// ─── Missile costs (USD) — conservative domestic procurement estimates ─────────
// Source: Defence Express & militarnyi.com analysis of Russian MoD procurement docs
// Kalibr: ~$1–2M (RUB 168M/unit per 2022-24 contract); Kh-101: ~$2–2.4M (2024-25 contract)
// Shahed: ~$20–50K; Iskander-M: ~$3M; Kinzhal: $10M+ (no public contract, estimated)
export const MISSILE_COSTS: Record<string, number> = {
  "Kalibr":                1_500_000,
  "Kh-101/Kh-555":         2_000_000,
  "Kh-101":                2_000_000,
  "Kh-555":                1_000_000,
  "Shahed-131/136":          30_000,
  "Shahed-136":              30_000,
  "Shahed-131":              30_000,
  "Shahed-238":              50_000,
  "Iskander-M/KN-23":      3_000_000,
  "Iskander-M":            3_000_000,
  "KN-23":                 3_000_000,
  "Kh-47M2 Kinzhal":      10_000_000,
  "Kh-22/32":              1_000_000,
  "Kh-22":                 1_000_000,
  "Kh-32":                 1_500_000,
  "S-300":                   300_000,
  "S-400":                   400_000,
  "S-300/S-400/S-350":       350_000,
  "Kh-59/69":              1_500_000,
  "Kh-59":                 1_000_000,
  "Kh-69":                 1_500_000,
  "Kh-35":                   500_000,
  "Tochka-U":              1_000_000,
  "Zircon":                7_000_000,
};
export const DEFAULT_MISSILE_COST = 1_000_000;

export function estimateTotalMissileCost(types: MissileType[]): number {
  return types.reduce((total, t) => {
    let cost = MISSILE_COSTS[t.model];
    if (cost === undefined) {
      // try partial match (e.g. "Kalibr 3M-14" matches "Kalibr")
      const key = Object.keys(MISSILE_COSTS).find(
        (k) =>
          t.model.toLowerCase().includes(k.toLowerCase()) ||
          k.toLowerCase().includes(t.model.toLowerCase()),
      );
      cost = key ? MISSILE_COSTS[key] : DEFAULT_MISSILE_COST;
    }
    return total + t.total_launched * cost;
  }, 0);
}

// ─── Interception rates (%) ───────────────────────────────────────────────────
// Iron Dome: IDF official average across all operations
export const IRON_DOME_RATE = 90;
// Gulf War Patriot: academic reassessment (MIT/Harvard, 1992) disputed ~9% actual rate
export const GULF_WAR_PATRIOT_RATE = 9;

// ─── Duration reference ───────────────────────────────────────────────────────
// US WWII involvement: Dec 7, 1941 – Aug 15, 1945 = 1,347 days
export const US_WWII_DAYS = 1_347;

// ─── "What could it buy" (conservative, citable estimates) ───────────────────
// School: ~$2M avg new construction, Eastern Europe (World Bank data)
// Hospital bed: ~$100K, developing-world context
// Vaccine: $3/dose, UNICEF bulk pricing (COVAX programme)
export const SCHOOL_COST_USD       = 2_000_000;
export const HOSPITAL_BED_COST_USD =   100_000;
export const VACCINE_COST_USD      =         3;

// ─── Explosive yield comparisons ────────────────────────────────────────────
// Average cruise/ballistic warhead: ~500 kg; Shahed drone: ~40-50 kg
export const AVG_MISSILE_WARHEAD_KG = 500;
export const AVG_DRONE_WARHEAD_KG   = 45;
export const HIROSHIMA_YIELD_KT     = 15; // kilotons

// ─── Historical bombardment ────────────────────────────────────────────────
// US "Shock and Awe" 2003 Iraq War: ~800 Tomahawk cruise missiles
export const SHOCK_AND_AWE_MISSILES = 800;

// ─── Defense economics ──────────────────────────────────────────────────────
export const DEFENSE_COST_TABLE = [
  { weapon: "Shahed Drone",       fireCost: 35_000,     interceptCost: "1M–4M",   interceptor: "NASAMS / Patriot" },
  { weapon: "Kh-101 Cruise",      fireCost: 1_500_000,  interceptCost: "3M–4M",   interceptor: "Patriot" },
  { weapon: "Kinzhal Hypersonic",  fireCost: 10_000_000, interceptCost: "8M+",     interceptor: "Multiple Patriots" },
];

// ─── Russia war economy ─────────────────────────────────────────────────────
export const RUSSIA_DEFENSE_BUDGET_PRE_WAR = 53_000_000_000;   // $53B (2021)
export const RUSSIA_CUMULATIVE_DEFENSE_SPEND = 500_000_000_000; // ~$500B (2022-2025)
export const ISS_COST = 150_000_000_000;                        // $150B
export const RUSSIA_DEFENSE_BUDGET_SHARE = 32;                   // 32% of federal budget
export const RUSSIA_LOST_GDP = 1_600_000_000_000;               // $1.6T
export const RUSSIA_POPULATION = 144_000_000;
export const RUSSIA_COST_PER_CITIZEN = 3_500;                   // ~$3,500

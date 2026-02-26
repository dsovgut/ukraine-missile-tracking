import { useState } from "react";
import type { Stats } from "../types";
import { useTranslation } from "../i18n";

interface Props {
  stats: Stats | null;
  totalCasualties: number;
}

/**
 * Detects when total missiles or casualties cross a round milestone
 * (e.g. 10,000 / 15,000 / 20,000) and shows a prominent banner.
 */
export default function MilestoneBanner({ stats, totalCasualties }: Props) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!stats || dismissed) return null;

  const totalLaunched = stats.all_time.launched;

  // Find the nearest round milestone the number has just crossed
  function getMilestone(value: number): number | null {
    // Check thresholds: 1000, 2000, 5000, 10000, 15000, 20000, 25000, ...
    const thresholds = [1000, 2000, 5000];
    for (let t = 10_000; t <= 200_000; t += 5_000) thresholds.push(t);

    // Find the highest threshold the value just crossed (within 2% above the threshold)
    for (let i = thresholds.length - 1; i >= 0; i--) {
      const th = thresholds[i];
      if (value >= th && value < th * 1.02) {
        return th;
      }
    }
    return null;
  }

  const missileMilestone = getMilestone(totalLaunched);
  const casualtyMilestone = getMilestone(totalCasualties);

  // Pick the most "impressive" one
  const milestone = missileMilestone || casualtyMilestone;
  if (!milestone) return null;

  const isMissile = missileMilestone !== null;
  const label = isMissile ? t("milestoneMissiles") : t("milestoneCasualties");
  const color = isMissile ? "#ef4444" : "#f59e0b";

  return (
    <div
      className="relative border rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3"
      style={{
        borderColor: color + "44",
        background: color + "0a",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="text-xs font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color }}
        >
          {t("milestonePrefix")}
        </span>
        <span className="text-white font-black text-lg tabular-nums">
          {milestone.toLocaleString()}
        </span>
        <span className="text-brand-text text-sm truncate">{label}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-brand-muted hover:text-white transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

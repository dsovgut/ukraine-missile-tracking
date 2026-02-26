import { useEffect, useState, useRef } from "react";
import type { Stats } from "../types";
import { estimateTotalMissileCost } from "../data/comparisons";
import type { MissileType } from "../types";
import { useTranslation } from "../i18n";

interface Props {
  stats: Stats | null;
  missileTypes: MissileType[];
}

export default function LiveCounter({ stats, missileTypes }: Props) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((Date.now() - startTime.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, []);

  if (!stats) return null;

  const totalLaunched = stats.all_time.launched;
  const days = stats.all_time.days;
  const missilesPerSecond = totalLaunched / (days * 86400);
  const costPerMissile = missileTypes.length > 0
    ? estimateTotalMissileCost(missileTypes) / totalLaunched
    : 1_000_000;

  const estimatedMissiles = missilesPerSecond * elapsed;
  const estimatedCost = estimatedMissiles * costPerMissile;

  const perHour = (missilesPerSecond * 3600).toFixed(1);
  const perDay = Math.round(missilesPerSecond * 86400);

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl px-5 py-4">
      <div className="flex items-center gap-3">
        {/* Pulsing red dot */}
        <div className="relative flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-red" />
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-brand-red animate-ping opacity-75" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-white leading-snug">
            {t("liveCounterSince")}{" "}
            <span className="font-black text-brand-red tabular-nums">
              {estimatedMissiles.toFixed(1)}
            </span>{" "}
            {t("liveCounterMissiles")}
            <span className="text-brand-text">
              {" "}(~${Math.round(estimatedCost).toLocaleString()})
            </span>
          </p>
          <p className="text-[11px] text-brand-muted mt-0.5">
            {t("liveCounterRate")} ~{perHour}/hr · ~{perDay}/day
          </p>
        </div>
      </div>
    </div>
  );
}

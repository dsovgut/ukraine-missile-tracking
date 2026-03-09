from __future__ import annotations

import logging
import time
from datetime import date, timedelta
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import get_db
from .models import DailyAttack, PersonnelLoss, WeatherData

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── simple TTL cache ─────────────────────────────────────────────────────────

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 300  # 5 minutes


def _get_cached(key: str) -> Any | None:
    if key in _cache:
        ts, val = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return val
        del _cache[key]
    return None


def _set_cached(key: str, val: Any) -> Any:
    _cache[key] = (time.time(), val)
    return val


# ─── helpers ─────────────────────────────────────────────────────────────────

def _eff(destroyed: int, launched: int) -> float:
    return round(destroyed / launched * 100, 1) if launched > 0 else 0.0


def _agg_daily(db: Session) -> pd.DataFrame:
    rows = (
        db.query(
            DailyAttack.date,
            func.sum(DailyAttack.launched).label("launched"),
            func.sum(DailyAttack.destroyed).label("destroyed"),
        )
        .group_by(DailyAttack.date)
        .order_by(DailyAttack.date)
        .all()
    )
    if not rows:
        return pd.DataFrame(columns=["date", "launched", "destroyed"])
    df = pd.DataFrame(rows, columns=["date", "launched", "destroyed"])
    df["date"] = pd.to_datetime(df["date"])
    return df


# ─── routes ──────────────────────────────────────────────────────────────────

@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, Any]:
    attack_count = db.query(func.count(DailyAttack.id)).scalar() or 0
    return {"status": "ok", "attack_records": attack_count}


@router.get("/missile-types")
def get_missile_types(db: Session = Depends(get_db)) -> list[dict]:
    cached = _get_cached("missile-types")
    if cached is not None:
        return cached

    rows = (
        db.query(
            DailyAttack.model,
            func.sum(DailyAttack.launched).label("total_launched"),
            func.sum(DailyAttack.destroyed).label("total_destroyed"),
        )
        .group_by(DailyAttack.model)
        .order_by(func.sum(DailyAttack.launched).desc())
        .all()
    )
    result = [
        {
            "model": r.model,
            "total_launched": r.total_launched,
            "total_destroyed": r.total_destroyed,
            "efficiency": _eff(r.total_destroyed, r.total_launched),
        }
        for r in rows
    ]
    return _set_cached("missile-types", result)


@router.get("/daily")
def get_daily(db: Session = Depends(get_db)) -> list[dict]:
    cached = _get_cached("daily")
    if cached is not None:
        return cached

    agg = _agg_daily(db)
    if agg.empty:
        return []

    personnel = {r.date: r.daily_losses for r in db.query(PersonnelLoss).all()}
    weather = {r.date: r for r in db.query(WeatherData).all()}

    result = []
    for _, row in agg.iterrows():
        d = row["date"].date()
        w = weather.get(d)
        result.append(
            {
                "date": str(d),
                "launched": int(row["launched"]),
                "destroyed": int(row["destroyed"]),
                "personnel_losses": personnel.get(d, 0),
                "temp_mean": w.temp_mean if w else None,
                "precip": w.precip if w else None,
                "wind_speed": w.wind_speed if w else None,
                "cloud_cover": w.cloud_cover if w else None,
            }
        )
    return _set_cached("daily", result)


@router.get("/weekly")
def get_weekly(db: Session = Depends(get_db)) -> list[dict]:
    cached = _get_cached("weekly")
    if cached is not None:
        return cached

    agg = _agg_daily(db)
    if agg.empty:
        return []

    personnel = {r.date: r.daily_losses for r in db.query(PersonnelLoss).all()}
    agg["personnel_losses"] = agg["date"].apply(lambda d: personnel.get(d.date(), 0))
    agg["week_start"] = agg["date"] - pd.to_timedelta(agg["date"].dt.dayofweek, unit="d")

    weekly = (
        agg.groupby("week_start")
        .agg({"launched": "sum", "destroyed": "sum", "personnel_losses": "sum"})
        .reset_index()
    )

    result = [
        {
            "week_start": str(row["week_start"].date()),
            "launched": int(row["launched"]),
            "destroyed": int(row["destroyed"]),
            "personnel_losses": int(row["personnel_losses"]),
            "efficiency": _eff(int(row["destroyed"]), int(row["launched"])),
        }
        for _, row in weekly.iterrows()
    ]
    return _set_cached("weekly", result)


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)) -> dict:
    cached = _get_cached("stats")
    if cached is not None:
        return cached

    agg = _agg_daily(db)
    if agg.empty:
        return {}

    latest = agg["date"].max()

    today_row = agg[agg["date"] == latest]
    tl = int(today_row["launched"].sum())
    td = int(today_row["destroyed"].sum())

    week_start = latest - timedelta(days=latest.weekday())
    wk = agg[agg["date"] >= week_start]
    wl, wd = int(wk["launched"].sum()), int(wk["destroyed"].sum())

    mo = agg[(agg["date"].dt.year == latest.year) & (agg["date"].dt.month == latest.month)]
    ml, md = int(mo["launched"].sum()), int(mo["destroyed"].sum())

    al, ad = int(agg["launched"].sum()), int(agg["destroyed"].sum())

    result = {
        "today": {"date": str(latest.date()), "launched": tl, "destroyed": td, "efficiency": _eff(td, tl)},
        "this_week": {"launched": wl, "destroyed": wd, "efficiency": _eff(wd, wl)},
        "this_month": {"launched": ml, "destroyed": md, "efficiency": _eff(md, ml)},
        "all_time": {
            "launched": al,
            "destroyed": ad,
            "efficiency": _eff(ad, al),
            "days": len(agg),
            "first_date": str(agg["date"].min().date()),
            "last_date": str(latest.date()),
        },
    }
    return _set_cached("stats", result)


@router.get("/by-model")
def get_by_model(db: Session = Depends(get_db)) -> list[dict]:
    """Return per-model per-day data for the missile type breakdown chart."""
    cached = _get_cached("by-model")
    if cached is not None:
        return cached

    rows = (
        db.query(
            DailyAttack.date,
            DailyAttack.model,
            func.sum(DailyAttack.launched).label("launched"),
            func.sum(DailyAttack.destroyed).label("destroyed"),
        )
        .group_by(DailyAttack.date, DailyAttack.model)
        .order_by(DailyAttack.date)
        .all()
    )
    result = [
        {
            "date": str(r.date),
            "model": r.model,
            "launched": r.launched,
            "destroyed": r.destroyed,
        }
        for r in rows
    ]
    return _set_cached("by-model", result)

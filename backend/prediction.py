"""Elastic Net prediction module.

Replicates the feature engineering from the Jupyter notebook analysis
and serves 14-day missile launch forecasts via a trained Elastic Net model.
"""

from __future__ import annotations

import logging
import math
from datetime import date, timedelta
from threading import Lock
from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import ElasticNet
from sklearn.preprocessing import MinMaxScaler

from .database import SessionLocal
from .models import DailyAttack, PersonnelLoss, WeatherData

logger = logging.getLogger(__name__)

# ── module-level state ────────────────────────────────────────────────────────
_model: ElasticNet | None = None
_scaler: MinMaxScaler | None = None
_feature_cols: list[str] = []
_target_scaler_min: float = 0.0
_target_scaler_range: float = 1.0
_lock = Lock()

FORECAST_DAYS = 14


# ── feature engineering ───────────────────────────────────────────────────────

def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Replicate the notebook feature-engineering pipeline."""
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Time features
    df["day_of_week_num"] = df["date"].dt.dayofweek + 1  # 1=Mon..7=Sun
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["day"] = df["date"].dt.day
    df["quarter"] = df["date"].dt.quarter
    df["is_weekend"] = (df["day_of_week_num"].isin([6, 7])).astype(int)
    df["day_of_year"] = df["date"].dt.dayofyear

    # Cyclical encodings
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    df["day_of_week_sin"] = np.sin(2 * np.pi * (df["day_of_week_num"] - 1) / 7)
    df["day_of_week_cos"] = np.cos(2 * np.pi * (df["day_of_week_num"] - 1) / 7)

    # Season one-hot
    season_map = {
        12: "Winter", 1: "Winter", 2: "Winter",
        3: "Spring", 4: "Spring", 5: "Spring",
        6: "Summer", 7: "Summer", 8: "Summer",
        9: "Fall", 10: "Fall", 11: "Fall",
    }
    df["season"] = df["month"].map(season_map)
    for s in ("Fall", "Spring", "Summer", "Winter"):
        df[f"season_{s}"] = (df["season"] == s).astype(int)
    df.drop(columns=["season"], inplace=True)

    # Days since start
    df["days_since_start"] = (df["date"] - df["date"].min()).dt.days

    # Lag features — launched
    for lag in (1, 2, 3, 7, 14, 30):
        df[f"launched_lag{lag}"] = df["launched"].shift(lag)
    df["launched_roll7"] = df["launched"].rolling(7).mean()
    df["launched_roll30"] = df["launched"].rolling(30).mean()

    # Lag features — personnel losses
    for lag in (1, 3, 7, 14, 30):
        df[f"personnel_lag{lag}"] = df["daily_personnel_losses"].shift(lag)
    df["personnel_roll7"] = df["daily_personnel_losses"].rolling(7).mean()
    df["personnel_roll30"] = df["daily_personnel_losses"].rolling(30).mean()

    # Lag features — destroyed
    for lag in (1, 3, 7, 14, 30):
        df[f"destroyed_lag{lag}"] = df["destroyed"].shift(lag)
    df["destroyed_roll7"] = df["destroyed"].rolling(7).mean()
    df["destroyed_roll30"] = df["destroyed"].rolling(30).mean()

    return df


def _load_raw_data() -> pd.DataFrame:
    """Pull daily data from the DB and merge missile + personnel + weather."""
    db = SessionLocal()
    try:
        # Aggregate daily missile totals
        from sqlalchemy import func

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
            return pd.DataFrame()

        missile_df = pd.DataFrame(rows, columns=["date", "launched", "destroyed"])
        missile_df["date"] = pd.to_datetime(missile_df["date"])

        # Personnel losses
        personnel = {
            r.date: r.daily_losses for r in db.query(PersonnelLoss).all()
        }
        missile_df["daily_personnel_losses"] = missile_df["date"].apply(
            lambda d: personnel.get(d.date(), 0)
        )

        # Weather
        weather_rows = db.query(WeatherData).all()
        weather_map = {r.date: r for r in weather_rows}
        for col in ("temp_max", "temp_min", "temp_mean", "precip", "wind_speed", "cloud_cover"):
            missile_df[col] = missile_df["date"].apply(
                lambda d, c=col: getattr(weather_map.get(d.date()), c, None)
            )

        # Fill weather NaNs with column median
        weather_cols = ["temp_max", "temp_min", "temp_mean", "precip", "wind_speed", "cloud_cover"]
        for c in weather_cols:
            missile_df[c] = pd.to_numeric(missile_df[c], errors="coerce")
            missile_df[c].fillna(missile_df[c].median(), inplace=True)

        return missile_df
    finally:
        db.close()


# ── training ──────────────────────────────────────────────────────────────────

def train_model() -> bool:
    """Train (or retrain) the Elastic Net model from DB data."""
    global _model, _scaler, _feature_cols, _target_scaler_min, _target_scaler_range

    raw = _load_raw_data()
    if raw.empty or len(raw) < 60:
        logger.warning("Not enough data to train prediction model (%d rows)", len(raw))
        return False

    df = _build_features(raw)
    df = df.dropna()  # lag/rolling features introduce NaNs at the start

    if len(df) < 40:
        logger.warning("Not enough rows after feature engineering (%d)", len(df))
        return False

    # Columns to exclude from features
    exclude = {"date", "launched", "destroyed", "daily_personnel_losses"}
    feature_cols = [c for c in df.columns if c not in exclude]

    X = df[feature_cols].values
    y = df["launched"].values.astype(float)

    # Scale features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    # Also scale target (notebook does this via full-df MinMaxScaler)
    y_min, y_max = float(y.min()), float(y.max())
    y_range = y_max - y_min if y_max != y_min else 1.0
    y_scaled = (y - y_min) / y_range

    model = ElasticNet(alpha=0.001, l1_ratio=0.1, max_iter=10000, random_state=42)
    model.fit(X_scaled, y_scaled)

    with _lock:
        _model = model
        _scaler = scaler
        _feature_cols = feature_cols
        _target_scaler_min = y_min
        _target_scaler_range = y_range

    logger.info(
        "Elastic Net trained on %d samples (%d features). Target range [%.1f, %.1f]",
        len(df), len(feature_cols), y_min, y_max,
    )
    return True


# ── forecasting ───────────────────────────────────────────────────────────────

def get_predictions(days: int = FORECAST_DAYS) -> dict[str, Any]:
    """Return forecast for the next *days* days plus recent actuals for context."""
    with _lock:
        model = _model
        scaler = _scaler
        feature_cols = list(_feature_cols)
        y_min = _target_scaler_min
        y_range = _target_scaler_range

    if model is None or scaler is None:
        return {"status": "not_ready", "forecast": [], "recent": []}

    raw = _load_raw_data()
    if raw.empty:
        return {"status": "no_data", "forecast": [], "recent": []}

    df = _build_features(raw)
    df = df.dropna().reset_index(drop=True)

    if df.empty:
        return {"status": "no_data", "forecast": [], "recent": []}

    # Recent actuals (last 30 days for chart context)
    recent_rows = df.tail(30)
    recent = [
        {
            "date": str(row["date"].date()),
            "launched": int(row["launched"]),
            "destroyed": int(row["destroyed"]),
        }
        for _, row in recent_rows.iterrows()
    ]

    # Recursive multi-step forecast
    forecast: list[dict] = []
    last_date = df["date"].max()
    history = df.copy()

    for step in range(days):
        forecast_date = last_date + timedelta(days=step + 1)

        # Build a single-row dataframe for the next day
        new_row: dict[str, Any] = {}
        new_row["date"] = forecast_date
        # Use last known weather (reasonable proxy for short-term forecast)
        last_row = history.iloc[-1]
        for wc in ("temp_max", "temp_min", "temp_mean", "precip", "wind_speed", "cloud_cover"):
            new_row[wc] = last_row[wc]
        new_row["daily_personnel_losses"] = last_row["daily_personnel_losses"]
        # Placeholder targets (will be predicted)
        new_row["launched"] = 0.0
        new_row["destroyed"] = 0.0

        # Append to history and re-derive features
        extended = pd.concat([history[["date", "launched", "destroyed", "daily_personnel_losses",
                                        "temp_max", "temp_min", "temp_mean", "precip",
                                        "wind_speed", "cloud_cover"]],
                               pd.DataFrame([new_row])], ignore_index=True)
        extended_feat = _build_features(extended)
        this_row = extended_feat.iloc[-1:]

        # Extract features and predict
        X_new = this_row[feature_cols].values
        X_new_scaled = scaler.transform(X_new)
        y_pred_scaled = model.predict(X_new_scaled)[0]
        y_pred = max(y_pred_scaled * y_range + y_min, 0)

        forecast.append({
            "date": str(forecast_date.date()),
            "predicted_launched": round(float(y_pred), 1),
        })

        # Feed prediction back into history for subsequent steps
        new_row["launched"] = y_pred
        new_row["destroyed"] = y_pred * 0.6  # rough defense ratio
        full_new = pd.DataFrame([new_row])
        full_new["date"] = pd.to_datetime(full_new["date"])
        history = pd.concat(
            [history[["date", "launched", "destroyed", "daily_personnel_losses",
                       "temp_max", "temp_min", "temp_mean", "precip",
                       "wind_speed", "cloud_cover"]],
             full_new],
            ignore_index=True,
        )

    return {
        "status": "ok",
        "model_info": {
            "name": "Elastic Net",
            "alpha": 0.001,
            "l1_ratio": 0.1,
            "r2": 0.2843,
            "features_used": len(feature_cols),
        },
        "forecast": forecast,
        "recent": recent,
    }

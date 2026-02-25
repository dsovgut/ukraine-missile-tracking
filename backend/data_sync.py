import os
import logging
import numpy as np
import pandas as pd
from .database import SessionLocal
from .models import DailyAttack, PersonnelLoss, WeatherData

logger = logging.getLogger(__name__)


def download_missile_data() -> pd.DataFrame | None:
    try:
        import kagglehub
        dataset_path = kagglehub.dataset_download("piterfm/massive-missile-attacks-on-ukraine")
        csv_path = os.path.join(dataset_path, "missile_attacks_daily.csv")
        df = pd.read_csv(csv_path)

        # Extract date from time_end column
        df["date"] = pd.to_datetime(df["time_end"], errors="coerce").dt.date
        df = df.dropna(subset=["date"])

        # Normalise model names
        df["model"] = df["model"].fillna("Unknown").str.strip()

        df["launched"] = pd.to_numeric(df["launched"], errors="coerce").fillna(0).astype(int)
        df["destroyed"] = pd.to_numeric(df["destroyed"], errors="coerce").fillna(0).astype(int)

        df = (
            df[["date", "model", "launched", "destroyed"]]
            .groupby(["date", "model"], as_index=False)
            .agg({"launched": "sum", "destroyed": "sum"})
        )
        logger.info(f"Downloaded {len(df)} missile attack rows across {df['date'].nunique()} dates")
        return df
    except Exception as exc:
        logger.error(f"Failed to download missile data: {exc}")
        return None


def download_personnel_data() -> pd.DataFrame | None:
    try:
        import kagglehub
        dataset_path = kagglehub.dataset_download("piterfm/2022-ukraine-russian-war")
        csv_path = os.path.join(dataset_path, "russia_losses_personnel.csv")
        df = pd.read_csv(csv_path)

        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
        df = df.dropna(subset=["date"]).sort_values("date")
        df["personnel"] = pd.to_numeric(df["personnel"], errors="coerce").fillna(0)
        df["daily_losses"] = df["personnel"].diff().fillna(0).clip(lower=0).astype(int)

        logger.info(f"Downloaded {len(df)} personnel loss rows")
        return df[["date", "daily_losses"]]
    except Exception as exc:
        logger.error(f"Failed to download personnel data: {exc}")
        return None


def download_weather_data(start_date, end_date) -> pd.DataFrame | None:
    try:
        import openmeteo_requests
        import requests_cache
        from retry_requests import retry

        cache_session = requests_cache.CachedSession(".cache", expire_after=3600)
        retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
        openmeteo = openmeteo_requests.Client(session=retry_session)

        params = {
            "latitude": 50.4501,
            "longitude": 30.5234,
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "precipitation_sum",
                "wind_speed_10m_max",
                "cloud_cover_mean",
            ],
            "start_date": str(start_date),
            "end_date": str(end_date),
            "timezone": "Europe/Kyiv",
        }

        responses = openmeteo.weather_api(
            "https://archive-api.open-meteo.com/v1/archive", params=params
        )
        response = responses[0]
        daily = response.Daily()

        weather_df = pd.DataFrame(
            {
                "date": pd.date_range(
                    start=pd.to_datetime(daily.Time(), unit="s"),
                    end=pd.to_datetime(daily.TimeEnd(), unit="s"),
                    freq=pd.Timedelta(seconds=daily.Interval()),
                    inclusive="left",
                ).date,
                "temp_max": daily.Variables(0).ValuesAsNumpy(),
                "temp_min": daily.Variables(1).ValuesAsNumpy(),
                "temp_mean": daily.Variables(2).ValuesAsNumpy(),
                "precip": daily.Variables(3).ValuesAsNumpy(),
                "wind_speed": daily.Variables(4).ValuesAsNumpy(),
                "cloud_cover": daily.Variables(5).ValuesAsNumpy(),
            }
        )
        logger.info(f"Downloaded {len(weather_df)} weather rows")
        return weather_df
    except Exception as exc:
        logger.error(f"Failed to download weather data: {exc}")
        return None


def _safe_float(val) -> float | None:
    try:
        f = float(val)
        return None if np.isnan(f) else round(f, 2)
    except Exception:
        return None


def sync_data():
    logger.info("Starting data sync…")
    db = SessionLocal()
    try:
        missile_df = download_missile_data()
        if missile_df is not None:
            db.query(DailyAttack).delete()
            db.bulk_insert_mappings(
                DailyAttack,
                [
                    {
                        "date": row["date"],
                        "model": row["model"],
                        "launched": int(row["launched"]),
                        "destroyed": int(row["destroyed"]),
                    }
                    for _, row in missile_df.iterrows()
                ],
            )
            db.commit()
            logger.info(f"Synced {len(missile_df)} missile attack records")

        personnel_df = download_personnel_data()
        if personnel_df is not None:
            db.query(PersonnelLoss).delete()
            db.bulk_insert_mappings(
                PersonnelLoss,
                [
                    {"date": row["date"], "daily_losses": int(row["daily_losses"])}
                    for _, row in personnel_df.iterrows()
                ],
            )
            db.commit()
            logger.info(f"Synced {len(personnel_df)} personnel loss records")

        if missile_df is not None:
            start_date = missile_df["date"].min()
            end_date = missile_df["date"].max()
            weather_df = download_weather_data(start_date, end_date)
            if weather_df is not None:
                db.query(WeatherData).delete()
                db.bulk_insert_mappings(
                    WeatherData,
                    [
                        {
                            "date": row["date"],
                            "temp_max": _safe_float(row["temp_max"]),
                            "temp_min": _safe_float(row["temp_min"]),
                            "temp_mean": _safe_float(row["temp_mean"]),
                            "precip": _safe_float(row["precip"]),
                            "wind_speed": _safe_float(row["wind_speed"]),
                            "cloud_cover": _safe_float(row["cloud_cover"]),
                        }
                        for _, row in weather_df.iterrows()
                    ],
                )
                db.commit()
                logger.info(f"Synced {len(weather_df)} weather records")

        logger.info("Data sync complete!")
    except Exception as exc:
        logger.error(f"Data sync failed: {exc}")
        db.rollback()
    finally:
        db.close()

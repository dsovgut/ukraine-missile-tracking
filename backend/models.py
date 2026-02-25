from sqlalchemy import Column, Integer, Float, String, Date
from .database import Base


class DailyAttack(Base):
    __tablename__ = "daily_attacks"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    model = Column(String, index=True)
    launched = Column(Integer, default=0)
    destroyed = Column(Integer, default=0)


class PersonnelLoss(Base):
    __tablename__ = "personnel_losses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    daily_losses = Column(Integer, default=0)


class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True)
    temp_max = Column(Float, nullable=True)
    temp_min = Column(Float, nullable=True)
    temp_mean = Column(Float, nullable=True)
    precip = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    cloud_cover = Column(Float, nullable=True)

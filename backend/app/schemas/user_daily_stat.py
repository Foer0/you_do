from datetime import date

from pydantic import BaseModel, ConfigDict


class DailyStatUpsert(BaseModel):
    total_duration_secs: int


class DailyStatResponse(BaseModel):
    total_secs: int
    session_count: int


class DailyStatResponceAfterUpsert(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_duration_secs: int
    for_date: date


class StatisticResponse(BaseModel):
    period: date
    time_secs: int

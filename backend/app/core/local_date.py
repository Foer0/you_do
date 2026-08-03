from datetime import date, datetime
from zoneinfo import ZoneInfo


def get_local_date(user_timezone: str) -> date:
    now_utc = datetime.now(ZoneInfo("UTC"))
    user_local = now_utc.astimezone(ZoneInfo(user_timezone))
    return user_local.date()

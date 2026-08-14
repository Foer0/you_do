from datetime import date

from dateutil.relativedelta import relativedelta
from sqlalchemy import Date, func, literal_column, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_daily_stat import UserDailyStat as UD
from app.models.user_setting import UserSetting as US


async def upsert_new_data(
    data: int, date_: date, session: AsyncSession, user_id: int
) -> tuple[UD, bool]:
    insert_stmt = pg_insert(UD).values(
        user_id=user_id, for_date=date_, total_duration_secs=data
    )
    stmt = insert_stmt.on_conflict_do_update(
        index_elements=["user_id", "for_date"],
        set_={
            "total_duration_secs": UD.total_duration_secs
            + insert_stmt.excluded.total_duration_secs
        },
    ).returning(UD, (literal_column("xmax") == 0).label("was_inserted"))

    result = await session.execute(stmt)
    row = result.one()
    await session.commit()
    stat, was_inserted = row
    return stat, was_inserted


async def get_sessions_data(date_, session: AsyncSession, user_id: int) -> dict:
    stmt = (
        select(
            UD.total_duration_secs, func.floor(UD.total_duration_secs / US.session_secs)
        )
        .join(US, UD.user_id == US.user_id)
        .where(UD.for_date == date_, UD.user_id == user_id)
    )

    row = (await session.execute(stmt)).one_or_none()
    if row is None:
        return {"total_secs": 0, "session_count": 0}
    total_secs, session_count = row
    return {"total_secs": total_secs, "session_count": session_count}


async def get_daily_monthly_stats(
    detailed: str, date_: date, session: AsyncSession, user_id: int
) -> list[dict]:
    start = date_.replace(day=1)
    end = start + relativedelta(months=1)

    stmt = (
        select(
            UD.for_date.label("period"),
            UD.total_duration_secs.label("time_secs"),
        )
        .where(UD.user_id == user_id, UD.for_date >= start, UD.for_date < end)
        .order_by("period")
    )

    result = await session.execute(stmt)
    return [{"period": row.period, "time_secs": row.time_secs} for row in result]


async def get_quarterly_stats(
    detailed: str, date_: date, session: AsyncSession, user_id: int
) -> list[dict]:
    start_month = 3 * ((date_.month - 1) // 3) + 1
    quarter_start = date(date_.year, start_month, 1)

    if start_month == 10:
        quarter_end = date(date_.year + 1, 1, 1)
    else:
        quarter_end = date(date_.year, start_month + 3, 1)

    period_expr = func.date_trunc(detailed, UD.for_date).cast(Date).label("period")

    stmt = (
        select(
            period_expr,
            func.sum(UD.total_duration_secs).label("time_secs"),
        )
        .where(
            UD.user_id == user_id,
            UD.for_date >= quarter_start,
            UD.for_date < quarter_end,
        )
        .group_by(period_expr)
        .order_by("period")
    )

    result = await session.execute(stmt)
    return [{"period": row.period, "time_secs": row.time_secs} for row in result]


async def get_monthly_yearly_stats(
    detailed: str, date_: date, session: AsyncSession, user_id: int
) -> list[dict]:
    start = date_.replace(month=1, day=1)
    end = start + relativedelta(years=1)

    period_expr = func.date_trunc(detailed, UD.for_date).cast(Date).label("period")

    stmt = (
        select(
            period_expr,
            func.sum(UD.total_duration_secs).label("time_secs"),
        )
        .where(UD.user_id == user_id, UD.for_date >= start, UD.for_date < end)
        .group_by(period_expr)
        .order_by("period")
    )

    result = await session.execute(stmt)
    lst = [{"period": row.period, "time_secs": row.time_secs} for row in result]
    return lst

from datetime import date

from sqlalchemy import literal_column, select
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
        select(UD.total_duration_secs, UD.total_duration_secs / US.session_secs)
        .join(US, UD.user_id == US.user_id)
        .where(UD.for_date == date_, UD.user_id == user_id)
    )

    row = (await session.execute(stmt)).one_or_none()
    if row is None:
        return {"total_secs": 0, "session_count": 0}
    total_secs, session_count = row
    return {"total_secs": total_secs, "session_count": session_count}

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker 


engine = create_async_engine(..., echo=True)

SessionLocal = async_sessionmaker(bind=engine)

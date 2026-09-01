import pytest
import pytest_asyncio
import redis.asyncio as redis
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

import app.core.redis_client as redis_module
from app.core.config import ENV_FILE_PATH, Settings
from app.core.dependencies import get_db
from app.main import app
from app.services import auth_service as auth_service_module

test_settings = Settings(_env_file=ENV_FILE_PATH.parent / ".env_test")

test_engine = create_async_engine(
    test_settings.database_url, echo=True, poolclass=NullPool
)


@pytest_asyncio.fixture
async def db_session():
    async with test_engine.connect() as connection:
        await connection.begin()

        session = AsyncSession(bind=connection, expire_on_commit=False)

        nested = await connection.begin_nested()

        @event.listens_for(session.sync_session, "after_transaction_end")
        def restart_savepoint(sync_session, transaction):
            nonlocal nested
            if not nested.is_active:
                nested = connection.sync_connection.begin_nested()

        yield session

        await session.close()
        await connection.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def redis_test_client(monkeypatch):
    test_client = redis.Redis(
        host=test_settings.redis_host,
        port=test_settings.redis_port,
        db=test_settings.redis_db,
        decode_responses=True,
    )

    monkeypatch.setattr(redis_module, "redis_client", test_client)

    yield test_client
    await test_client.flushdb()
    await test_client.aclose()


@pytest.fixture
def mock_google_verify(monkeypatch):
    def _set_response(fake_payload: dict):
        async def fake_verify_google_token(token: str):
            if token != "valid_token":
                raise ValueError
            return fake_payload

        monkeypatch.setattr(
            auth_service_module, "verify_google_token", fake_verify_google_token
        )

    return _set_response


@pytest.fixture
def register_payload():
    return {
        "email": "test_user_1@example.com",
        "password": "super_secret_123",
        "timezone": "Europe/Minsk",
    }

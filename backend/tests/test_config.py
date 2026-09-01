import asyncio

from tests.conftest import test_settings


def test_settings_loaded():
    assert test_settings.db_name == "youdo_test"


async def test_async_example():
    await asyncio.sleep(0.1)
    assert True

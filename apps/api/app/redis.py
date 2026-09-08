import redis.asyncio as redis
from typing import AsyncGenerator
from app.config import get_settings

import os

settings = get_settings()

redis_url = os.getenv("REDIS_URL", settings.REDIS_URL)
redis_client = redis.from_url(redis_url, decode_responses=True)

async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    yield redis_client

async def close_redis():
    await redis_client.close()

import redis.asyncio as redis
from typing import AsyncGenerator
from app.config import get_settings

settings = get_settings()

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def get_redis() -> AsyncGenerator[redis.Redis, None]:
    yield redis_client

async def close_redis():
    await redis_client.close()

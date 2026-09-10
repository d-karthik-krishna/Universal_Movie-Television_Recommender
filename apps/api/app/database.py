from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.config import get_settings

import os

settings = get_settings()

database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)

# Supabase's connection pooler (port 6543) uses transaction mode,
# which doesn't support prepared statements. Disable the cache.
connect_args = {}
if "pooler.supabase.com" in database_url or "supabase" in database_url:
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args=connect_args,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session

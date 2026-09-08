from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as redis
import httpx
import time
from app.schemas.health import HealthResponse, ServiceHealthResponse
from app.database import get_db
from app.redis import get_redis
from app.config import get_settings

router = APIRouter()

@router.get("/", response_model=HealthResponse)
async def check_health():
    settings = get_settings()
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        environment=settings.ENVIRONMENT
    )

@router.get("/db", response_model=ServiceHealthResponse)
async def check_db(db: AsyncSession = Depends(get_db)):
    start_time = time.time()
    try:
        await db.execute(text("SELECT 1"))
        latency = (time.time() - start_time) * 1000
        return ServiceHealthResponse(status="healthy", service="database", latency_ms=latency, error=None)
    except Exception as e:
        return ServiceHealthResponse(status="unhealthy", service="database", latency_ms=None, error=str(e))

@router.get("/redis", response_model=ServiceHealthResponse)
async def check_redis_status(redis_client: redis.Redis = Depends(get_redis)):
    start_time = time.time()
    try:
        await redis_client.ping()
        latency = (time.time() - start_time) * 1000
        return ServiceHealthResponse(status="healthy", service="redis", latency_ms=latency, error=None)
    except Exception as e:
        return ServiceHealthResponse(status="unhealthy", service="redis", latency_ms=None, error=str(e))

@router.get("/tmdb", response_model=ServiceHealthResponse)
async def check_tmdb():
    settings = get_settings()
    start_time = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.themoviedb.org/3/configuration",
                params={"api_key": settings.TMDB_API_KEY}
            )
            response.raise_for_status()
        latency = (time.time() - start_time) * 1000
        return ServiceHealthResponse(status="healthy", service="tmdb", latency_ms=latency, error=None)
    except Exception as e:
        error_msg = str(e).replace(settings.TMDB_API_KEY, "***") if settings.TMDB_API_KEY else str(e)
        return ServiceHealthResponse(status="unhealthy", service="tmdb", latency_ms=None, error=error_msg)

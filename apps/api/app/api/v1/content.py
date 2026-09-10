from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.services.sync import ContentSyncService
from app.schemas.content import ContentResponse
from app.providers.tmdb import tmdb_provider

router = APIRouter()

@router.post("/sync/genres")
async def sync_genres(db: AsyncSession = Depends(get_db)):
    """Admin endpoint to fetch and store all genres from TMDB."""
    service = ContentSyncService(db)
    count = await service.sync_genres()
    return {"status": "success", "genres_synced": count}

@router.get("/trending")
async def get_trending(
    media_type: str = Query("all", description="all, movie, tv, person"),
    time_window: str = Query("day", description="day or week"),
    db: AsyncSession = Depends(get_db)
):
    """Get trending content. Fetches from TMDB and hydrates DB automatically."""
    import traceback
    try:
        service = ContentSyncService(db)
        return await service.get_or_sync_trending(media_type, time_window)
    except Exception as e:
        print(f"TRENDING ERROR: {e}")
        traceback.print_exc()
        # Fallback: return TMDB data directly without DB sync
        try:
            tmdb_res = await tmdb_provider.get_trending(media_type, time_window)
            return tmdb_res
        except Exception as e2:
            print(f"TMDB FALLBACK ERROR: {e2}")
            traceback.print_exc()
            raise

@router.get("/discover")
async def discover_content(
    media_type: str = Query("movie", description="movie or tv"),
    with_original_language: Optional[str] = None,
    with_genres: Optional[str] = None,
    with_origin_country: Optional[str] = None,
    sort_by: Optional[str] = Query(None, description="e.g. popularity.desc, vote_average.desc"),
    vote_count_gte: Optional[int] = Query(None, description="Filter by minimum vote count"),
    page: int = Query(1, ge=1, le=500),
    db: AsyncSession = Depends(get_db)
):
    """Discover content by filters. Hydrates DB automatically."""
    import traceback
    try:
        service = ContentSyncService(db)
        
        filters = {"page": page}
        if with_original_language:
            filters["with_original_language"] = with_original_language
        if with_genres:
            filters["with_genres"] = with_genres
        if with_origin_country:
            filters["with_origin_country"] = with_origin_country
        if sort_by:
            filters["sort_by"] = sort_by
        if vote_count_gte is not None:
            filters["vote_count.gte"] = vote_count_gte
            
        return await service.discover_content(media_type, **filters)
    except Exception as e:
        print(f"DISCOVER ERROR: {e}")
        traceback.print_exc()
        # Fallback: return TMDB data directly without DB sync
        try:
            filters = {"page": page}
            if with_original_language:
                filters["with_original_language"] = with_original_language
            if with_genres:
                filters["with_genres"] = with_genres
            if with_origin_country:
                filters["with_origin_country"] = with_origin_country
            if sort_by:
                filters["sort_by"] = sort_by
            if vote_count_gte is not None:
                filters["vote_count.gte"] = vote_count_gte
            tmdb_res = await tmdb_provider.discover(media_type, **filters)
            return tmdb_res
        except Exception as e2:
            print(f"TMDB FALLBACK ERROR: {e2}")
            traceback.print_exc()
            raise

@router.get("/search")
async def search_content(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, le=500)
):
    """Search movies, TV shows, and people via TMDB multi-search."""
    results = await tmdb_provider.search_multi(q, page)
    return results

@router.get("/{media_type}/{tmdb_id}")
async def get_content_detail(
    media_type: str,
    tmdb_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get full details for a movie or TV show, including credits, videos, and similar titles."""
    import asyncio
    
    # Fetch details, credits, videos, and similar in parallel
    if media_type == "movie":
        detail_coro = tmdb_provider.get_movie_details(tmdb_id)
    else:
        detail_coro = tmdb_provider.get_series_details(tmdb_id)
    
    details, credits, videos, similar = await asyncio.gather(
        detail_coro,
        tmdb_provider.get_credits(media_type, tmdb_id),
        tmdb_provider.get_videos(media_type, tmdb_id),
        tmdb_provider.get_similar(media_type, tmdb_id),
    )
    
    # Also sync into our DB
    service = ContentSyncService(db)
    content = await service.sync_single_item(tmdb_id, media_type)
    
    # Filter videos to YouTube only and relevant types
    youtube_videos = [
        v for v in videos.get("results", [])
        if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser", "Clip", "Featurette")
    ]
    
    # Sort: Official first, Trailer > Teaser > Featurette > Clip, then newest
    def video_sort_key(v):
        type_score = {"Trailer": 3, "Teaser": 2, "Featurette": 1, "Clip": 0}.get(v.get("type"), 0)
        official_score = 1 if v.get("official") else 0
        date_str = v.get("published_at", "")
        return (official_score, type_score, date_str)
        
    youtube_videos.sort(key=video_sort_key, reverse=True)
    trailers = youtube_videos
    # Top-billed cast (limit to 15)
    cast = credits.get("cast", [])[:15]
    
    # Similar (limit to 10)
    similar_results = similar.get("results", [])[:10]
    
    return {
        **details,
        "credits": {"cast": cast},
        "trailers": trailers,
        "similar": similar_results,
        "watch_providers": content.watch_providers if content else {}
    }

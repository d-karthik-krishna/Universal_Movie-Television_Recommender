from typing import Annotated, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete

from app.database import get_db
from app.models.user import User
from app.models.watchlist import WatchlistItem
from app.models.rating import Rating
from app.models.watch_history import WatchHistory
from app.models.content import Content
from app.schemas.actions import WatchlistAdd, RatingSubmit, HistoryAdd, WatchedMark, SeasonProgressUpdate, FavoriteMark
from app.api.deps import get_current_user
from app.services.sync import ContentSyncService

router = APIRouter()

# ── Watchlist ──────────────────────────────────────────────

@router.post("/watchlist", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    item: WatchlistAdd,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(item.tmdb_id, item.media_type)
    
    result = await db.execute(
        select(WatchlistItem).where(
            and_(WatchlistItem.user_id == current_user.id, WatchlistItem.content_id == content.id)
        )
    )
    if result.scalar_one_or_none():
        return {"message": "Already in watchlist"}
        
    watchlist_item = WatchlistItem(user_id=current_user.id, content_id=content.id)
    db.add(watchlist_item)
    await db.commit()
    return {"message": "Added to watchlist"}

@router.delete("/watchlist/{tmdb_id}/{media_type}")
async def remove_from_watchlist(
    tmdb_id: int,
    media_type: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(tmdb_id, media_type)
    
    await db.execute(
        delete(WatchlistItem).where(
            and_(WatchlistItem.user_id == current_user.id, WatchlistItem.content_id == content.id)
        )
    )
    await db.commit()
    return {"message": "Removed from watchlist"}

@router.get("/watchlist")
async def get_watchlist(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    from app.models.provider_mapping import ProviderMapping
    
    result = await db.execute(
        select(Content, ProviderMapping.provider_id)
        .join(WatchlistItem, WatchlistItem.content_id == Content.id)
        .outerjoin(ProviderMapping, and_(
            ProviderMapping.content_id == Content.id,
            ProviderMapping.provider_name == 'tmdb'
        ))
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.added_at.desc())
    )
    
    # Construct a list of dicts that Next.js expects
    results = []
    for content, tmdb_id in result.all():
        content_dict = {
            "id": int(tmdb_id) if tmdb_id else str(content.id),
            "content_type": content.content_type,
            "title": content.title,
            "original_title": content.original_title,
            "overview": content.overview,
            "release_date": content.release_date.isoformat() if content.release_date else None,
            "popularity": content.popularity,
            "vote_average": content.vote_average,
            "vote_count": content.vote_count,
            "poster_path": content.poster_path,
            "backdrop_path": content.backdrop_path,
            "original_language": content.original_language,
            "watch_providers": content.watch_providers,
        }
        results.append(content_dict)
        
    return results

# ── Ratings ────────────────────────────────────────────────

@router.get("/ratings")
async def get_all_ratings(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    from app.models.provider_mapping import ProviderMapping
    
    result = await db.execute(
        select(Content, ProviderMapping.provider_id, Rating.score, Rating.review)
        .join(Rating, Rating.content_id == Content.id)
        .outerjoin(ProviderMapping, and_(
            ProviderMapping.content_id == Content.id,
            ProviderMapping.provider_name == 'tmdb'
        ))
        .where(Rating.user_id == current_user.id)
        .order_by(Rating.created_at.desc())
    )
    
    results = []
    for content, tmdb_id, score, review in result.all():
        content_dict = {
            "id": int(tmdb_id) if tmdb_id else str(content.id),
            "content_type": content.content_type,
            "title": content.title,
            "original_title": content.original_title,
            "overview": content.overview,
            "release_date": content.release_date.isoformat() if content.release_date else None,
            "popularity": content.popularity,
            "vote_average": content.vote_average,
            "vote_count": content.vote_count,
            "poster_path": content.poster_path,
            "backdrop_path": content.backdrop_path,
            "original_language": content.original_language,
            "watch_providers": content.watch_providers,
            "user_rating": score,
            "user_review": review
        }
        results.append(content_dict)
        
    return results

@router.post("/rating", status_code=status.HTTP_200_OK)
async def submit_rating(
    rating_in: RatingSubmit,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(rating_in.tmdb_id, rating_in.media_type)
    
    # Check if watched
    watched_check = await db.execute(
        select(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "watched",
            )
        )
    )
    if not watched_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must watch the content before submitting a rating or feedback.",
        )
    
    result = await db.execute(
        select(Rating).where(
            and_(Rating.user_id == current_user.id, Rating.content_id == content.id)
        )
    )
    existing_rating = result.scalar_one_or_none()
    
    if existing_rating:
        existing_rating.score = rating_in.rating
        if rating_in.review_text is not None:
            existing_rating.review = rating_in.review_text
    else:
        new_rating = Rating(
            user_id=current_user.id,
            content_id=content.id,
            score=rating_in.rating,
            review=rating_in.review_text
        )
        db.add(new_rating)
        
    await db.commit()
    return {"message": "Rating saved"}

@router.get("/rating/{tmdb_id}/{media_type}")
async def get_rating(
    tmdb_id: int,
    media_type: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(tmdb_id, media_type)
    
    result = await db.execute(
        select(Rating).where(
            and_(Rating.user_id == current_user.id, Rating.content_id == content.id)
        )
    )
    rating = result.scalar_one_or_none()
    if not rating:
        return {"rating": None, "review": None}
    
    return {"rating": rating.score, "review": rating.review}


# ── Watch History ──────────────────────────────────────────

@router.post("/history", status_code=status.HTTP_201_CREATED)
async def add_history(
    history_in: HistoryAdd,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(history_in.tmdb_id, history_in.media_type)
    
    history_item = WatchHistory(
        user_id=current_user.id,
        content_id=content.id,
        interaction_type="watched",
        metadata_json={"watch_duration": history_in.watch_duration} if history_in.watch_duration else None
    )
    db.add(history_item)
    await db.commit()
    return {"message": "Added to history"}

@router.get("/history")
async def get_history(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    from app.models.provider_mapping import ProviderMapping
    
    result = await db.execute(
        select(Content, ProviderMapping.provider_id)
        .join(WatchHistory, WatchHistory.content_id == Content.id)
        .outerjoin(ProviderMapping, and_(
            ProviderMapping.content_id == Content.id,
            ProviderMapping.provider_name == 'tmdb'
        ))
        .where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.interaction_type == "watched"
            )
        )
        .order_by(WatchHistory.timestamp.desc())
    )
    
    results = []
    for content, tmdb_id in result.all():
        content_dict = {
            "id": int(tmdb_id) if tmdb_id else str(content.id),
            "content_type": content.content_type,
            "title": content.title,
            "original_title": content.original_title,
            "overview": content.overview,
            "release_date": content.release_date.isoformat() if content.release_date else None,
            "popularity": content.popularity,
            "vote_average": content.vote_average,
            "vote_count": content.vote_count,
            "poster_path": content.poster_path,
            "backdrop_path": content.backdrop_path,
            "original_language": content.original_language,
            "watch_providers": content.watch_providers,
        }
        results.append(content_dict)
        
    return results

# ── Favorites ──────────────────────────────────────────────

@router.get("/favorites")
async def get_favorites(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    from app.models.provider_mapping import ProviderMapping
    
    result = await db.execute(
        select(Content, ProviderMapping.provider_id)
        .join(WatchHistory, WatchHistory.content_id == Content.id)
        .outerjoin(ProviderMapping, and_(
            ProviderMapping.content_id == Content.id,
            ProviderMapping.provider_name == 'tmdb'
        ))
        .where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.interaction_type == "favorite"
            )
        )
        .order_by(WatchHistory.timestamp.desc())
    )
    
    results = []
    for content, tmdb_id in result.all():
        content_dict = {
            "id": int(tmdb_id) if tmdb_id else str(content.id),
            "content_type": content.content_type,
            "title": content.title,
            "original_title": content.original_title,
            "overview": content.overview,
            "release_date": content.release_date.isoformat() if content.release_date else None,
            "popularity": content.popularity,
            "vote_average": content.vote_average,
            "vote_count": content.vote_count,
            "poster_path": content.poster_path,
            "backdrop_path": content.backdrop_path,
            "original_language": content.original_language,
            "watch_providers": content.watch_providers,
        }
        results.append(content_dict)
        
    return results

@router.get("/favorites/ids")
async def get_favorite_ids(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    from app.models.provider_mapping import ProviderMapping

    result = await db.execute(
        select(ProviderMapping.provider_id)
        .join(WatchHistory, WatchHistory.content_id == ProviderMapping.content_id)
        .where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.interaction_type == "favorite",
                ProviderMapping.provider_name == "tmdb",
            )
        )
    )
    ids = [int(row) for row in result.scalars().all()]
    return {"ids": ids}

@router.post("/favorites", status_code=status.HTTP_201_CREATED)
async def mark_favorite(
    item: FavoriteMark,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(item.tmdb_id, item.media_type)

    # Must be watched first
    watched_check = await db.execute(
        select(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "watched",
            )
        )
    )
    if not watched_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must watch the content before adding it to favorites.",
        )

    result = await db.execute(
        select(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "favorite",
            )
        )
    )
    if result.scalar_one_or_none():
        return {"message": "Already marked as favorite"}

    history_item = WatchHistory(
        user_id=current_user.id,
        content_id=content.id,
        interaction_type="favorite",
    )
    db.add(history_item)
    await db.commit()
    return {"message": "Marked as favorite"}

@router.delete("/favorites/{tmdb_id}/{media_type}")
async def unmark_favorite(
    tmdb_id: int,
    media_type: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(tmdb_id, media_type)

    await db.execute(
        delete(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "favorite",
            )
        )
    )
    await db.commit()
    return {"message": "Removed from favorites"}

# ── Watched ────────────────────────────────────────────────

@router.get("/watched/ids")
async def get_watched_ids(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    from app.models.provider_mapping import ProviderMapping

    result = await db.execute(
        select(ProviderMapping.provider_id)
        .join(WatchHistory, WatchHistory.content_id == ProviderMapping.content_id)
        .where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.interaction_type == "watched",
                ProviderMapping.provider_name == "tmdb",
            )
        )
    )
    ids = [int(row) for row in result.scalars().all()]
    return {"ids": ids}


@router.post("/watched", status_code=status.HTTP_201_CREATED)
async def mark_watched(
    item: WatchedMark,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(item.tmdb_id, item.media_type)

    # Auto-remove from watchlist if it's a movie, or a TV show without season tracking
    if item.media_type == "movie" or not content.number_of_seasons:
        await db.execute(
            delete(WatchlistItem).where(
                and_(
                    WatchlistItem.user_id == current_user.id,
                    WatchlistItem.content_id == content.id
                )
            )
        )

    result = await db.execute(
        select(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "watched",
            )
        )
    )
    if result.scalar_one_or_none():
        await db.commit()
        return {"message": "Already marked as watched"}

    history_item = WatchHistory(
        user_id=current_user.id,
        content_id=content.id,
        interaction_type="watched",
    )
    db.add(history_item)
        
    await db.commit()
    return {"message": "Marked as watched"}


@router.delete("/watched/{tmdb_id}/{media_type}")
async def unmark_watched(
    tmdb_id: int,
    media_type: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(tmdb_id, media_type)

    # Delete 'watched'
    await db.execute(
        delete(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "watched",
            )
        )
    )
    
    # Delete 'favorite'
    await db.execute(
        delete(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "favorite",
            )
        )
    )
    
    # Delete 'rating'
    await db.execute(
        delete(Rating).where(
            and_(
                Rating.user_id == current_user.id,
                Rating.content_id == content.id,
            )
        )
    )
    
    await db.commit()
    return {"message": "Removed from watched"}


@router.post("/watched/season")
async def save_season_progress(
    progress_in: SeasonProgressUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(progress_in.tmdb_id, "tv")

    result = await db.execute(
        select(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "watched",
            )
        )
    )
    history_item = result.scalar_one_or_none()

    if not history_item:
        history_item = WatchHistory(
            user_id=current_user.id,
            content_id=content.id,
            interaction_type="watched",
            metadata_json={},
        )
        db.add(history_item)
        await db.flush()

    metadata = history_item.metadata_json or {}
    seasons = metadata.get("seasons", {})
    seasons[str(progress_in.season_number)] = {
        "watched_all": progress_in.watched_all,
        "watched_episodes": progress_in.watched_episodes,
        "total_episodes": progress_in.total_episodes,
    }
    metadata["seasons"] = seasons
    history_item.metadata_json = metadata

    # Auto-remove from watchlist if all regular seasons are watched
    if content.number_of_seasons:
        watched_seasons_count = sum(1 for s in seasons.values() if s.get("watched_all"))
        if watched_seasons_count >= content.number_of_seasons:
            await db.execute(
                delete(WatchlistItem).where(
                    and_(
                        WatchlistItem.user_id == current_user.id,
                        WatchlistItem.content_id == content.id
                    )
                )
            )

    await db.commit()
    return {"seasons": seasons}


@router.get("/watched/{tmdb_id}/progress")
async def get_season_progress(
    tmdb_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    sync_service = ContentSyncService(db)
    content = await sync_service.sync_single_item(tmdb_id, "tv")

    result = await db.execute(
        select(WatchHistory).where(
            and_(
                WatchHistory.user_id == current_user.id,
                WatchHistory.content_id == content.id,
                WatchHistory.interaction_type == "watched",
            )
        )
    )
    history_item = result.scalar_one_or_none()

    if not history_item:
        return {"seasons": {}}

    metadata = history_item.metadata_json or {}
    return {"seasons": metadata.get("seasons", {})}


@router.get("/public/{username}")
async def get_public_profile(
    username: str,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    # Get user
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from app.models.provider_mapping import ProviderMapping
    
    # Get watched history, along with favorites and ratings if available
    # For a unified view
    watched_query = (
        select(Content, ProviderMapping.provider_id, WatchHistory.metadata_json)
        .join(WatchHistory, WatchHistory.content_id == Content.id)
        .outerjoin(ProviderMapping, and_(
            ProviderMapping.content_id == Content.id,
            ProviderMapping.provider_name == 'tmdb'
        ))
        .where(
            and_(
                WatchHistory.user_id == user.id,
                WatchHistory.interaction_type == 'watched'
            )
        )
    )
    
    watched_result = await db.execute(watched_query)
    watched_items = []
    
    content_ids = []
    content_map = {}
    
    for content, provider_id, metadata in watched_result:
        item_id = int(provider_id) if provider_id else content.id
        content_ids.append(content.id)
        
        # Calculate year
        year = None
        if content.content_type == 'movie' and content.release_date:
            year = content.release_date.year
        elif content.content_type == 'tv' and content.release_date:
            year = content.release_date.year
            
        progress = metadata.get("seasons", {}) if metadata else {}
            
        content_map[content.id] = {
            "id": item_id,
            "title": content.title,
            "media_type": content.content_type,
            "poster_path": content.poster_path,
            "year": year,
            "number_of_seasons": content.number_of_seasons,
            "progress": progress,
            "user_rating": None,
            "is_favorite": False
        }
        
    if content_ids:
        # Get ratings
        ratings_query = select(Rating.content_id, Rating.score).where(
            and_(Rating.user_id == user.id, Rating.content_id.in_(content_ids))
        )
        ratings_result = await db.execute(ratings_query)
        for cid, score in ratings_result:
            if cid in content_map:
                content_map[cid]["user_rating"] = score
                
        # Get favorites
        fav_query = select(WatchHistory.content_id).where(
            and_(
                WatchHistory.user_id == user.id,
                WatchHistory.content_id.in_(content_ids),
                WatchHistory.interaction_type == 'favorite'
            )
        )
        fav_result = await db.execute(fav_query)
        for cid, in fav_result:
            if cid in content_map:
                content_map[cid]["is_favorite"] = True
                
    return {
        "user": {
            "display_name": user.display_name,
            "username": user.username,
            "bio": user.bio,
            "avatar_url": user.avatar_url
        },
        "watched": list(content_map.values())
    }

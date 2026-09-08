import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from app.models.watchlist import WatchlistItem
from app.models.rating import Rating
from app.models.watch_history import WatchHistory
from app.models.provider_mapping import ProviderMapping
from app.providers.tmdb import tmdb_provider
from app.services.sync import ContentSyncService

class RecommendationEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.sync_service = ContentSyncService(db)

    async def get_personalized_recommendations(self, user_id: uuid.UUID) -> List[Dict[Any, Any]]:
        """
        Generates personalized recommendations by:
        1. Extracting high-rated or recently watchlisted items as 'seeds'
        2. Querying TMDB for similar items
        3. Filtering out anything the user has already watched, rated, or watchlisted
        """
        # 1. Get all content IDs the user has interacted with (to exclude them)
        interacted_content_ids = set()
        
        watchlist_res = await self.db.execute(select(WatchlistItem.content_id).where(WatchlistItem.user_id == user_id))
        interacted_content_ids.update(watchlist_res.scalars().all())
        
        history_res = await self.db.execute(select(WatchHistory.content_id).where(WatchHistory.user_id == user_id))
        interacted_content_ids.update(history_res.scalars().all())
        
        rating_res = await self.db.execute(select(Rating.content_id).where(Rating.user_id == user_id))
        interacted_content_ids.update(rating_res.scalars().all())
        
        # 2. Map interacted local content IDs to TMDB IDs
        exclude_tmdb_ids = set()
        if interacted_content_ids:
            mapping_res = await self.db.execute(
                select(ProviderMapping.provider_id)
                .where(
                    ProviderMapping.content_id.in_(interacted_content_ids),
                    ProviderMapping.provider_name == 'tmdb'
                )
            )
            exclude_tmdb_ids.update(int(pid) for pid in mapping_res.scalars().all())

        # 3. Find "Seeds" - top rated movies (>= 4.0), or recent watchlist items
        seeds = [] # List of tuples: (tmdb_id, media_type)
        
        high_ratings = await self.db.execute(
            select(ProviderMapping.provider_id, ProviderMapping.provider_content_type)
            .join(Rating, Rating.content_id == ProviderMapping.content_id)
            .where(
                Rating.user_id == user_id, 
                Rating.score >= 4.0, 
                ProviderMapping.provider_name == 'tmdb'
            )
            .order_by(Rating.created_at.desc())
            .limit(3)
        )
        seeds.extend([(int(r[0]), r[1]) for r in high_ratings.all()])
        
        if len(seeds) < 3:
            recent_watchlist = await self.db.execute(
                select(ProviderMapping.provider_id, ProviderMapping.provider_content_type)
                .join(WatchlistItem, WatchlistItem.content_id == ProviderMapping.content_id)
                .where(WatchlistItem.user_id == user_id, ProviderMapping.provider_name == 'tmdb')
                .order_by(WatchlistItem.added_at.desc())
                .limit(3 - len(seeds))
            )
            seeds.extend([(int(r[0]), r[1]) for r in recent_watchlist.all()])
            
        # 4. If no seeds, fallback to generic trending
        if not seeds:
            trending = await self.sync_service.get_or_sync_trending("movie", "week")
            return trending.get("results", [])[:20]
            
        # 5. Fetch similar items from TMDB for each seed
        raw_candidates = []
        for tmdb_id, media_type in seeds:
            try:
                # Use standard fallback if media_type is invalid
                m_type = media_type if media_type in ["movie", "tv"] else "movie"
                similar = await tmdb_provider.get_similar(m_type, tmdb_id)
                similar_results = similar.get("results", [])
                for item in similar_results:
                    if "media_type" not in item:
                        item["media_type"] = m_type
                raw_candidates.extend(similar_results)
            except Exception:
                continue
                
        # 6. Deduplicate and filter out already seen items
        unique_candidates = {}
        for item in raw_candidates:
            item_id = item.get("id")
            if not item_id:
                continue
            if item_id in exclude_tmdb_ids:
                continue
            if item_id not in unique_candidates:
                unique_candidates[item_id] = item
                
        # 7. Sort by a mix of popularity and vote average
        sorted_candidates = sorted(
            unique_candidates.values(),
            key=lambda x: (x.get("vote_average", 0) * 10) + x.get("popularity", 0),
            reverse=True
        )
        
        # 8. Return top 20 and optionally sync them in the background (we can just return them for now)
        top_20 = sorted_candidates[:20]
        
        # Hydrate the top 20 into the DB asynchronously (fire and forget basically, or await)
        # For data consistency, we'll await them here
        for item in top_20:
            m_type = item.get('media_type', 'movie') # fallback
            if 'first_air_date' in item and 'media_type' not in item:
                m_type = 'tv'
            await self.sync_service._get_or_create_content_from_tmdb(item, m_type)
            
        await self.db.commit()
        
        return top_20

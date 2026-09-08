from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid
import asyncio

from app.models.content import Content
from app.models.genre import Genre, ContentGenre
from app.models.provider_mapping import ProviderMapping
from app.providers.tmdb import tmdb_provider

class ContentSyncService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def sync_genres(self):
        """Fetches both movie and tv genres from TMDB and upserts them into the database."""
        movie_genres = await tmdb_provider.get_genres("movie")
        tv_genres = await tmdb_provider.get_genres("tv")
        
        # Merge lists, avoiding duplicates by id
        all_genres = {g['id']: g for g in movie_genres + tv_genres}.values()
        
        for g in all_genres:
            result = await self.db.execute(select(Genre).filter(Genre.id == g['id']))
            existing = result.scalar_one_or_none()
            if not existing:
                self.db.add(Genre(id=g['id'], name=g['name']))
            else:
                existing.name = g['name']
                
        await self.db.commit()
        return len(all_genres)

    async def _get_or_create_content_from_tmdb(self, tmdb_data: dict, content_type: str) -> Content:
        """Helper to sync a single TMDB item to the database."""
        tmdb_id = str(tmdb_data.get('id'))
        
        # 1. Check if mapping exists
        result = await self.db.execute(
            select(ProviderMapping)
            .filter(ProviderMapping.provider_name == 'tmdb', ProviderMapping.provider_id == tmdb_id)
        )
        mapping = result.scalar_one_or_none()
        
        if mapping:
            content_result = await self.db.execute(
                select(Content).filter(Content.id == mapping.content_id)
            )
            content = content_result.scalar_one_or_none()
            if content:
                # Update basic metrics that change frequently
                content.popularity = tmdb_data.get('popularity')
                content.vote_average = tmdb_data.get('vote_average')
                content.vote_count = tmdb_data.get('vote_count')
                return content

        # 2. Doesn't exist, create it
        # Handle release date safely (might be empty string)
        release_date_str = tmdb_data.get('release_date') or tmdb_data.get('first_air_date')
        release_date = None
        if release_date_str:
            try:
                release_date = datetime.strptime(release_date_str, '%Y-%m-%d').date()
            except ValueError:
                pass

        new_content = Content(
            content_type=content_type,
            title=tmdb_data.get('title') or tmdb_data.get('name'),
            original_title=tmdb_data.get('original_title') or tmdb_data.get('original_name'),
            overview=tmdb_data.get('overview'),
            release_date=release_date,
            popularity=tmdb_data.get('popularity'),
            vote_average=tmdb_data.get('vote_average'),
            vote_count=tmdb_data.get('vote_count'),
            poster_path=tmdb_data.get('poster_path'),
            backdrop_path=tmdb_data.get('backdrop_path'),
            original_language=tmdb_data.get('original_language'),
            adult=tmdb_data.get('adult', False)
        )
        self.db.add(new_content)
        await self.db.flush() # get new_content.id

        # 3. Add mapping
        new_mapping = ProviderMapping(
            content_id=new_content.id,
            provider_name='tmdb',
            provider_id=tmdb_id,
            provider_content_type=content_type
        )
        self.db.add(new_mapping)
        
        # 4. Add genre relations
        genre_ids = tmdb_data.get('genre_ids', [])
        for g_id in genre_ids:
            # We don't verify genre exists first for performance, assumes sync_genres ran
            self.db.add(ContentGenre(content_id=new_content.id, genre_id=g_id))

        return new_content

    async def _hydrate_providers_for_tmdb_results(self, results: list[dict], default_media_type: str = 'movie'):
        """Fetches missing watch providers from TMDB in parallel and updates DB & results."""
        from datetime import datetime, timezone
        
        items_to_fetch = []
        
        # Determine which items need fetching (not in DB, or missing providers)
        for item in results:
            tmdb_id = str(item.get('id'))
            media_type = item.get('media_type', default_media_type)
            
            result = await self.db.execute(
                select(Content)
                .join(ProviderMapping, Content.id == ProviderMapping.content_id)
                .filter(ProviderMapping.provider_name == 'tmdb', ProviderMapping.provider_id == tmdb_id)
            )
            content = result.scalar_one_or_none()
            
            # If we have it and it's fresh enough (synced in last 7 days), just attach it
            if content and content.watch_providers is not None and content.providers_synced_at:
                delta = datetime.now(timezone.utc) - content.providers_synced_at
                if delta.days < 7:
                    item['watch_providers'] = content.watch_providers
                    continue
                    
            # Needs fetching
            items_to_fetch.append((item, media_type, content))
            
        if not items_to_fetch:
            return

        # Fetch in parallel
        async def fetch_providers(item_tuple):
            item_dict, m_type, db_content = item_tuple
            try:
                prov_res = await tmdb_provider.get_watch_providers(m_type, item_dict['id'])
                providers = prov_res.get('results', {})
                return item_tuple, providers
            except Exception as e:
                print(f"Failed to fetch providers for {item_dict['id']}: {e}")
                return item_tuple, {}

        fetch_results = await asyncio.gather(*(fetch_providers(it) for it in items_to_fetch))
        
        # Update DB and dicts
        now = datetime.now(timezone.utc)
        for (item_dict, m_type, db_content), providers in fetch_results:
            item_dict['watch_providers'] = providers
            if db_content:
                db_content.watch_providers = providers
                db_content.providers_synced_at = now
            else:
                # If not in DB yet, create it first
                db_content = await self._get_or_create_content_from_tmdb(item_dict, m_type)
                db_content.watch_providers = providers
                db_content.providers_synced_at = now

    async def get_or_sync_trending(self, media_type: str = "all", time_window: str = "day") -> dict:
        tmdb_res = await tmdb_provider.get_trending(media_type, time_window)
        results = tmdb_res.get("results", [])
        
        for item in results:
            item_media_type = item.get('media_type', 'movie')
            await self._get_or_create_content_from_tmdb(item, item_media_type)
            
        await self.db.commit()
        await self._hydrate_providers_for_tmdb_results(results)
        await self.db.commit()
        
        return tmdb_res

    async def discover_content(self, media_type: str = "movie", **filters) -> dict:
        tmdb_res = await tmdb_provider.discover(media_type, **filters)
        results = tmdb_res.get("results", [])
        
        for item in results:
            await self._get_or_create_content_from_tmdb(item, media_type)
            
        await self.db.commit()
        await self._hydrate_providers_for_tmdb_results(results, default_media_type=media_type)
        await self.db.commit()
        
        return tmdb_res

    async def sync_single_item(self, tmdb_id: int, media_type: str) -> Content:
        from datetime import datetime, timezone
        
        result = await self.db.execute(
            select(Content)
            .join(ProviderMapping, Content.id == ProviderMapping.content_id)
            .filter(ProviderMapping.provider_name == 'tmdb', ProviderMapping.provider_id == str(tmdb_id))
        )
        content = result.scalar_one_or_none()
        
        # Doesn't exist, fetch from TMDB
        if not content:
            if media_type == 'movie':
                tmdb_data = await tmdb_provider.get_movie_details(tmdb_id)
            else:
                tmdb_data = await tmdb_provider.get_series_details(tmdb_id)
                
            content = await self._get_or_create_content_from_tmdb(tmdb_data, media_type)
        
        # Check if providers need sync
        if not content.watch_providers or not content.providers_synced_at or (datetime.now(timezone.utc) - content.providers_synced_at).days >= 7:
            try:
                prov_res = await tmdb_provider.get_watch_providers(media_type, tmdb_id)
                content.watch_providers = prov_res.get('results', {})
                content.providers_synced_at = datetime.now(timezone.utc)
            except Exception:
                pass
                
        await self.db.commit()
        return content

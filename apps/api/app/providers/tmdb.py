import httpx
from typing import Any
from app.providers.base import MovieDataProvider
from app.config import get_settings

class TMDBProvider(MovieDataProvider):
    def __init__(self):
        settings = get_settings()
        self.base_url = "https://api.tmdb.org/3"
        self.headers = {
            "Authorization": f"Bearer {settings.TMDB_ACCESS_TOKEN}",
            "Accept": "application/json"
        }
        
    async def _get(self, endpoint: str, params: dict[str, Any] = None) -> dict:
        async with httpx.AsyncClient(base_url=self.base_url, headers=self.headers, timeout=30.0) as client:
            response = await client.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()

    async def search_movies(self, query: str, page: int = 1, language: str = "en-US") -> dict:
        return await self._get("/search/movie", {"query": query, "page": page, "language": language})

    async def search_series(self, query: str, page: int = 1, language: str = "en-US") -> dict:
        return await self._get("/search/tv", {"query": query, "page": page, "language": language})

    async def get_movie_details(self, movie_id: int) -> dict:
        return await self._get(f"/movie/{movie_id}")

    async def get_series_details(self, series_id: int) -> dict:
        return await self._get(f"/tv/{series_id}")

    async def get_trending(self, media_type: str = "all", time_window: str = "day") -> dict:
        return await self._get(f"/trending/{media_type}/{time_window}")

    async def get_popular(self, media_type: str = "movie", page: int = 1) -> dict:
        return await self._get(f"/{media_type}/popular", {"page": page})

    async def get_genres(self, media_type: str = "movie") -> list:
        data = await self._get(f"/genre/{media_type}/list")
        return data.get("genres", [])

    async def discover(self, media_type: str = "movie", **filters) -> dict:
        return await self._get(f"/discover/{media_type}", params=filters)

    async def get_credits(self, media_type: str, tmdb_id: int) -> dict:
        return await self._get(f"/{media_type}/{tmdb_id}/credits")

    async def get_videos(self, media_type: str, tmdb_id: int) -> dict:
        return await self._get(f"/{media_type}/{tmdb_id}/videos")

    async def get_similar(self, media_type: str, tmdb_id: int) -> dict:
        return await self._get(f"/{media_type}/{tmdb_id}/similar")

    async def search_multi(self, query: str, page: int = 1) -> dict:
        return await self._get("/search/multi", {"query": query, "page": page})

    async def get_watch_providers(self, media_type: str, tmdb_id: int) -> dict:
        return await self._get(f"/{media_type}/{tmdb_id}/watch/providers")

tmdb_provider = TMDBProvider()
